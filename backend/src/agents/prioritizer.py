import json
import re
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class DimensionScores(BaseModel):
    impacto_negocio: int = Field(description="Valor aportado al usuario/cliente (1-5)", ge=1, le=5)
    riesgo_tecnico: int = Field(description="Complejidad de implementacion (1-5)", ge=1, le=5)
    esfuerzo_estimado: int = Field(description="Recursos necesarios (1-5, donde 5 es mas esfuerzo)", ge=1, le=5)
    dependencias: int = Field(description="Numero de requisitos que bloquea (1-5)", ge=1, le=5)


class MoscowScore(BaseModel):
    requisito_id: str
    dimensiones: DimensionScores
    score_final: float = Field(description="Score ponderado final")
    categoria_moscow: str = Field(description="Must Have, Should Have, Could Have, Won't Have")
    justificacion: str = Field(description="Explicacion de la priorizacion")


class ConflictReport(BaseModel):
    requisito_1: str
    requisito_2: str
    tipo_conflicto: str = Field(description="Tecnico, Negocio, Recurso, Dependencia")
    descripcion: str
    resolucion_sugerida: str


class PriorizacionResultado(BaseModel):
    metadata: Dict[str, Any]
    requisitos_priorizados: List[MoscowScore]
    moscow_labels: Dict[str, str] = Field(description="Mapping de ID a categoria MoSCoW")
    conflict_report: List[ConflictReport]
    priority_scores: Dict[str, float] = Field(description="Mapping de ID a score final")


class AgentePriorizador:
    """
    Agente que prioriza requisitos usando el metodo MoSCoW con scoring cuantificado.
    Evalua multiples dimensiones: impacto negocio, riesgo tecnico, esfuerzo, dependencias.
    """
    
    # Pesos para cada dimension (pueden ajustarse segun necesidades del proyecto)
    PESOS = {
        "impacto_negocio": 0.40,   # Mayor peso: valor al negocio
        "riesgo_tecnico": 0.25,    # Riesgo moderado
        "esfuerzo_estimado": 0.20, # Esfuerzo considerado
        "dependencias": 0.15       # Dependencias menor peso
    }
    
    # Umbrales para categorias MoSCoW
    UMBRAL_MUST = 4.0      # Score >= 4.0 -> Must Have
    UMBRAL_SHOULD = 3.0    # Score >= 3.0 y < 4.0 -> Should Have
    UMBRAL_COULD = 2.0     # Score >= 2.0 y < 3.0 -> Could Have
    # Score < 2.0 -> Won't Have
    
    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", temperature=0.2, format="json")
    
    def _calcular_score_final(self, dimensiones: DimensionScores) -> float:
        """Calcula el score final ponderado."""
        score = (
            dimensiones.impacto_negocio * self.PESOS["impacto_negocio"] +
            dimensiones.riesgo_tecnico * self.PESOS["riesgo_tecnico"] +
            (6 - dimensiones.esfuerzo_estimado) * self.PESOS["esfuerzo_estimado"] +
            dimensiones.dependencias * self.PESOS["dependencias"]
        )
        return round(min(5.0, max(1.0, score)), 2)
    
    def _determinar_categoria_moscow(self, score: float) -> str:
        """Determina la categoria MoSCoW basada en el score."""
        if score >= self.UMBRAL_MUST:
            return "Must Have"
        elif score >= self.UMBRAL_SHOULD:
            return "Should Have"
        elif score >= self.UMBRAL_COULD:
            return "Could Have"
        else:
            return "Won't Have"
    
    def _evaluar_dimensiones_llm(self, requisito: Dict[str, Any]) -> DimensionScores:
        """Usa LLM para evaluar las dimensiones de un requisito."""
        prompt = ChatPromptTemplate.from_template(
            """Eres un Analista de Negocios y Arquitecto de Software experto en priorizacion de requisitos.
            
            Analiza el siguiente REQUISITO y evalua sus dimensiones:
            
            ID: {id}
            Tipo: {tipo}
            Descripcion: {descripcion}
            Prioridad original: {prioridad_original}
            Criterio de aceptacion: {criterio}
            
            Evalua cada dimension en escala 1-5 (1 = muy bajo, 5 = muy alto):
            
            1. Impacto en negocio (1-5): Valor aportado al usuario/cliente
            2. Riesgo tecnico (1-5): Complejidad de implementacion
            3. Esfuerzo estimado (1-5): Recursos necesarios
            4. Dependencias (1-5): Numero de requisitos que bloquea
            
            Responde UNICAMENTE con un objeto JSON:
            {{
                "impacto_negocio": <1-5>,
                "riesgo_tecnico": <1-5>,
                "esfuerzo_estimado": <1-5>,
                "dependencias": <1-5>
            }}
            """
        )
        
        chain = prompt | self.llm
        respuesta = chain.invoke({
            "id": requisito.get("id", ""),
            "tipo": requisito.get("tipo", ""),
            "descripcion": requisito.get("descripcion", ""),
            "prioridad_original": requisito.get("prioridad", ""),
            "criterio": requisito.get("criterio_aceptacion", "")
        })
        
        try:
            datos = json.loads(respuesta.content)
            return DimensionScores(**datos)
        except json.JSONDecodeError as e:
            print(f"   [Error] No se pudo parsear JSON: {e}")
            print(f"   Respuesta: {respuesta.content[:200]}")
            # Valores por defecto
            return DimensionScores(
                impacto_negocio=3,
                riesgo_tecnico=3,
                esfuerzo_estimado=3,
                dependencias=3
            )
    
    def _detectar_conflictos(self, requisitos: List[Dict[str, Any]]) -> List[ConflictReport]:
        """Detecta conflictos entre requisitos usando LLM."""
        if len(requisitos) < 2:
            return []
        
        resumen_requisitos = []
        for req in requisitos:
            resumen_requisitos.append(f"- {req.get('id')}: {req.get('descripcion')}")
        
        prompt = ChatPromptTemplate.from_template(
            """Analiza la siguiente lista de requisitos y detecta conflictos entre ellos:
            
            {requisitos}
            
            Posibles conflictos: Tecnico, Negocio, Recurso, Dependencia
            
            Responde SOLO con un array JSON. Ejemplo: [{{"requisito_1": "RF-01", "requisito_2": "RF-02", "tipo_conflicto": "Tecnico", "descripcion": "...", "resolucion_sugerida": "..."}}]
            
            Si no hay conflictos, responde: []
            """
        )
        
        chain = prompt | self.llm
        respuesta = chain.invoke({"requisitos": "\n".join(resumen_requisitos)})
        
        conflictos = []
        
        try:
            contenido = respuesta.content.strip()
            
            # Limpiar posibles markdown o texto extra
            if contenido.startswith("```json"):
                contenido = contenido[7:]
            if contenido.startswith("```"):
                contenido = contenido[3:]
            if contenido.endswith("```"):
                contenido = contenido[:-3]
            contenido = contenido.strip()
            
            if not contenido or contenido == "[]":
                return []
            
            datos = json.loads(contenido)
            
            if isinstance(datos, list):
                for conf in datos:
                    if isinstance(conf, dict) and all(k in conf for k in ["requisito_1", "requisito_2", "tipo_conflicto", "descripcion", "resolucion_sugerida"]):
                        conflictos.append(ConflictReport(**conf))
            elif isinstance(datos, dict):
                conflictos.append(ConflictReport(**datos))
                
        except json.JSONDecodeError:
            pass  # Ignorar errores de parsing, no es critico
        except Exception:
            pass
        
        return conflictos
    
    def priorizar(self, requisitos_clasificados: List[Dict[str, Any]]) -> PriorizacionResultado:
        """Prioriza una lista de requisitos usando MoSCoW cuantificado."""
        resultados = []
        moscow_labels = {}
        priority_scores = {}
        
        print("\n" + "="*60)
        print("EVALUANDO DIMENSIONES PARA CADA REQUISITO")
        print("="*60)
        
        for i, req in enumerate(requisitos_clasificados, 1):
            print(f"\n[{i}/{len(requisitos_clasificados)}] Analizando {req.get('id')}...")
            
            dimensiones = self._evaluar_dimensiones_llm(req)
            score_final = self._calcular_score_final(dimensiones)
            categoria = self._determinar_categoria_moscow(score_final)
            justificacion = self._generar_justificacion(req.get('id'), dimensiones, score_final, categoria)
            
            resultado = MoscowScore(
                requisito_id=req.get('id'),
                dimensiones=dimensiones,
                score_final=score_final,
                categoria_moscow=categoria,
                justificacion=justificacion
            )
            
            resultados.append(resultado)
            moscow_labels[req.get('id')] = categoria
            priority_scores[req.get('id')] = score_final
            
            print(f"   Impacto Negocio: {dimensiones.impacto_negocio}/5")
            print(f"   Riesgo Tecnico: {dimensiones.riesgo_tecnico}/5")
            print(f"   Esfuerzo: {dimensiones.esfuerzo_estimado}/5")
            print(f"   Dependencias: {dimensiones.dependencias}/5")
            print(f"   Score Final: {score_final} -> [{categoria}]")
        
        resultados.sort(key=lambda x: x.score_final, reverse=True)
        
        print("\n" + "="*60)
        print("DETECTANDO CONFLICTOS ENTRE REQUISITOS")
        print("="*60)
        conflictos = self._detectar_conflictos(requisitos_clasificados)
        
        if conflictos:
            print(f"\nSe detectaron {len(conflictos)} conflictos:")
            for conf in conflictos:
                print(f"   - {conf.requisito_1} <-> {conf.requisito_2}: {conf.tipo_conflicto}")
        else:
            print("\nNo se detectaron conflictos significativos")
        
        return PriorizacionResultado(
            metadata={
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "metodo": "MoSCoW Cuantificado con Scoring Multidimensional",
                "pesos_dimensiones": self.PESOS,
                "umbrales": {
                    "must_have": self.UMBRAL_MUST,
                    "should_have": self.UMBRAL_SHOULD,
                    "could_have": self.UMBRAL_COULD
                }
            },
            requisitos_priorizados=[r.model_dump() for r in resultados],
            moscow_labels=moscow_labels,
            conflict_report=[c.model_dump() for c in conflictos],
            priority_scores=priority_scores
        )
    
    def _generar_justificacion(self, req_id: str, dims: DimensionScores, score: float, categoria: str) -> str:
        """Genera una justificacion textual de la priorizacion."""
        justificaciones = []
        
        if dims.impacto_negocio >= 4:
            justificaciones.append(f"alto impacto de negocio ({dims.impacto_negocio}/5)")
        elif dims.impacto_negocio <= 2:
            justificaciones.append(f"bajo impacto de negocio ({dims.impacto_negocio}/5)")
        
        if dims.riesgo_tecnico >= 4:
            justificaciones.append(f"requiere mitigacion de riesgo tecnico ({dims.riesgo_tecnico}/5)")
        
        if dims.esfuerzo_estimado <= 2:
            justificaciones.append(f"bajo esfuerzo estimado ({dims.esfuerzo_estimado}/5)")
        elif dims.esfuerzo_estimado >= 4:
            justificaciones.append(f"alto esfuerzo requerido ({dims.esfuerzo_estimado}/5)")
        
        if dims.dependencias >= 4:
            justificaciones.append(f"bloquea multiples requisitos ({dims.dependencias}/5)")
        
        texto = f"Prioridad {categoria} con score {score}/5 debido a: " + ", ".join(justificaciones) if justificaciones else f"Prioridad {categoria} con score {score}/5"
        
        if categoria == "Must Have":
            texto += ". Requisito critico para el exito del proyecto."
        elif categoria == "Won't Have":
            texto += " No se implementara en este ciclo."
        
        return texto


def priorizar_desde_archivo(archivo_entrada: str, archivo_salida: str = None):
    """Funcion utilitaria para priorizar requisitos desde un archivo JSON."""
    with open(archivo_entrada, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        requisitos = data
    elif isinstance(data, dict):
        if "requisitos" in data:
            requisitos = data["requisitos"]
        elif "requisito" in data:
            requisitos = [data["requisito"]]
        else:
            requisitos = [data]
    else:
        raise ValueError("Formato de archivo no soportado")
    
    agente = AgentePriorizador()
    resultado = agente.priorizar(requisitos)
    
    if archivo_salida is None:
        archivo_salida = archivo_entrada.replace(".json", "_priorizado.json")
    
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(resultado.model_dump(), f, indent=4, ensure_ascii=False)
    
    print(f"\n[INFO] Resultado guardado en: {archivo_salida}")
    return resultado


if __name__ == "__main__":
    requisitos_ejemplo = [
        {
            "id": "RF-01",
            "tipo": "Funcional",
            "descripcion": "El sistema debe permitir registrar horas de clase",
            "prioridad": "Alta",
            "criterio_aceptacion": "Verificar que el sistema permita registrar y guardar correctamente las horas de clase"
        },
        {
            "id": "RF-02",
            "tipo": "Funcional",
            "descripcion": "El sistema debe generar reportes automaticos de asistencia",
            "prioridad": "Media",
            "criterio_aceptacion": "El reporte debe incluir total de horas por alumno y periodo"
        }
    ]
    
    agente = AgentePriorizador()
    resultado = agente.priorizar(requisitos_ejemplo)
    
    print("\n" + "="*60)
    print("RESULTADO FINAL - REQUISITOS PRIORIZADOS (MoSCoW)")
    print("="*60)
    
    for req in resultado.requisitos_priorizados:
        print(f"\n{req['requisito_id']}: [{req['categoria_moscow']}] - Score: {req['score_final']}")
        print(f"   Justificacion: {req['justificacion']}")