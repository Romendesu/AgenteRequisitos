import json
from datetime import datetime
from typing import List, Dict, Any

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field


class DimensionScores(BaseModel):
    impacto_negocio: int = Field(ge=1, le=5)
    riesgo_tecnico: int = Field(ge=1, le=5)
    esfuerzo_estimado: int = Field(ge=1, le=5)
    dependencias: int = Field(ge=1, le=5)


class MoscowScore(BaseModel):
    requisito_id: str
    dimensiones: DimensionScores
    score_final: float
    categoria_moscow: str
    justificacion: str


class ConflictReport(BaseModel):
    requisito_1: str
    requisito_2: str
    tipo_conflicto: str
    descripcion: str
    resolucion_sugerida: str


class PriorizacionResultado(BaseModel):
    metadata: Dict[str, Any]
    requisitos_priorizados: List[MoscowScore]
    moscow_labels: Dict[str, str]
    conflict_report: List[ConflictReport]
    priority_scores: Dict[str, float]


# ─── Palabras clave para scoring determinista ─────────────────────────────────

_KEYWORDS_CRITICO = [
    "autenticación", "autenticar", "login", "inicio de sesión",
    "seguridad", "cifrado", "encriptación", "rgpd", "gdpr", "legal", "cumplimiento",
    "disponibilidad", "uptime", "tiempo real", "crítico", "crítica",
    "motor de generación", "generación automática", "motor de reglas",
    "gestión de usuarios", "crud", "alta, baja", "crear, leer",
    "kill switch", "control de emergencia", "obligatorio", "imprescindible",
    "backtracking", "algoritmo", "optimización", "coordinación",
]

_KEYWORDS_COMPLEJO = [
    "algoritmo genético", "búsqueda tabú", "backtracking",
    "machine learning", "inteligencia artificial",
    "tiempo real", "concurrente", "simultáneo", "distribuido",
    "encriptación", "cifrado", "firma digital",
    "coordinación", "sincronización", "integración",
]

_KEYWORDS_SIMPLE = [
    "listar", "mostrar", "visualizar", "consultar",
    "exportar a pdf", "exportar a excel", "descargar informe",
    "notificación visual", "cambiar color", "ajustar estilo",
]

_KEYWORDS_WONT = [
    "futuro", "próxima versión", "versión 2", "v2",
    "no prioritario", "opcional avanzado", "nice to have",
    "descartado", "fuera de alcance", "no implementar",
]

_KEYWORDS_CORE = [
    "motor", "generación", "core", "base del sistema",
    "autenticación", "gestión de usuarios", "modelo de datos",
    "infraestructura", "arquitectura base",
]


class AgentePriorizador:
    PESOS = {
        "impacto_negocio":  0.40,
        "riesgo_tecnico":   0.25,
        "esfuerzo_estimado": 0.20,
        "dependencias":     0.15,
    }

    # Umbrales ajustados para producir las 4 categorías con naturalidad
    UMBRAL_MUST   = 3.5   # Alta prioridad normal → Must Have
    UMBRAL_SHOULD = 2.5   # Prioridad media → Should Have
    UMBRAL_COULD  = 1.5   # Baja prioridad → Could Have
    # < 1.5 → Won't Have

    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", temperature=0.2, format="json")

    # ─── Scoring determinista (no depende del LLM) ────────────────────────────

    def _evaluar_dimensiones(self, req: Dict[str, Any]) -> DimensionScores:
        prioridad = req.get("prioridad", "Media").strip()
        tipo      = req.get("tipo", "Funcional").strip()
        desc      = (req.get("descripcion", "") + " " + req.get("criterio_aceptacion", "")).lower()

        # 1. Impacto de negocio — basado en prioridad + keywords
        base_impacto = {"Alta": 5, "Media": 3, "Baja": 1}.get(prioridad, 3)
        if any(k in desc for k in _KEYWORDS_CRITICO):
            base_impacto = min(5, base_impacto + 1)
        if any(k in desc for k in _KEYWORDS_WONT):
            base_impacto = max(1, base_impacto - 2)

        # 2. Riesgo técnico — por complejidad del requisito
        if any(k in desc for k in _KEYWORDS_COMPLEJO):
            riesgo = 4
        elif any(k in desc for k in _KEYWORDS_SIMPLE):
            riesgo = 2
        else:
            riesgo = 3

        # 3. Esfuerzo estimado — RD son constraints (bajo esfuerzo de impl.),
        #    requisitos complejos tienen más esfuerzo
        if "Dominio" in tipo:
            esfuerzo = 2   # Las restricciones de dominio no se implementan, se validan
        elif any(k in desc for k in _KEYWORDS_COMPLEJO):
            esfuerzo = 4
        elif any(k in desc for k in _KEYWORDS_SIMPLE):
            esfuerzo = 2
        elif prioridad == "Baja" and any(k in desc for k in _KEYWORDS_WONT):
            esfuerzo = 5   # Baja + fuera de alcance = mucho esfuerzo/coste de oportunidad
        else:
            esfuerzo = 3

        # 4. Dependencias — requisitos core bloquean muchos otros
        if any(k in desc for k in _KEYWORDS_CORE):
            dependencias = 4
        elif "No Funcional" in tipo:
            dependencias = 2   # RNF raramente bloquean funcionales
        else:
            dependencias = 3

        return DimensionScores(
            impacto_negocio=base_impacto,
            riesgo_tecnico=riesgo,
            esfuerzo_estimado=esfuerzo,
            dependencias=dependencias,
        )

    def _calcular_score(self, d: DimensionScores) -> float:
        score = (
            d.impacto_negocio  * self.PESOS["impacto_negocio"] +
            d.riesgo_tecnico   * self.PESOS["riesgo_tecnico"] +
            (6 - d.esfuerzo_estimado) * self.PESOS["esfuerzo_estimado"] +
            d.dependencias     * self.PESOS["dependencias"]
        )
        return round(min(5.0, max(1.0, score)), 2)

    def _categoria_moscow(self, score: float) -> str:
        if score >= self.UMBRAL_MUST:
            return "Must Have"
        if score >= self.UMBRAL_SHOULD:
            return "Should Have"
        if score >= self.UMBRAL_COULD:
            return "Could Have"
        return "Won't Have"

    def _justificacion(self, req_id: str, d: DimensionScores, score: float, cat: str) -> str:
        partes = []
        if d.impacto_negocio >= 4:
            partes.append(f"alto impacto de negocio ({d.impacto_negocio}/5)")
        elif d.impacto_negocio <= 2:
            partes.append(f"bajo impacto de negocio ({d.impacto_negocio}/5)")
        if d.esfuerzo_estimado >= 4:
            partes.append(f"esfuerzo de implementación elevado ({d.esfuerzo_estimado}/5)")
        elif d.esfuerzo_estimado <= 2:
            partes.append(f"bajo coste de implementación ({d.esfuerzo_estimado}/5)")
        if d.dependencias >= 4:
            partes.append("bloquea múltiples componentes del sistema")
        if d.riesgo_tecnico >= 4:
            partes.append(f"riesgo técnico elevado ({d.riesgo_tecnico}/5)")

        base = f"{cat} — score {score}/5"
        if partes:
            base += ": " + ", ".join(partes) + "."
        if cat == "Must Have":
            base += " Requisito crítico para el MVP."
        elif cat == "Won't Have":
            base += " No se implementará en este ciclo de desarrollo."
        return base

    # ─── Detección de conflictos (LLM, no crítico) ───────────────────────────

    def _detectar_conflictos(self, requisitos: List[Dict]) -> List[ConflictReport]:
        if len(requisitos) < 2:
            return []
        resumen = "\n".join(f"- {r.get('id')}: {r.get('descripcion')}" for r in requisitos)
        prompt = ChatPromptTemplate.from_template(
            """Analiza los siguientes requisitos y detecta conflictos reales entre ellos.

{requisitos}

Responde SOLO con un array JSON. Si no hay conflictos, responde: []
Formato: [{{"requisito_1":"RF-01","requisito_2":"RF-02","tipo_conflicto":"Tecnico","descripcion":"...","resolucion_sugerida":"..."}}]"""
        )
        try:
            resp = (prompt | self.llm).invoke({"requisitos": resumen})
            contenido = resp.content.strip()
            for tag in ("```json", "```"):
                contenido = contenido.replace(tag, "")
            contenido = contenido.strip()
            if not contenido or contenido == "[]":
                return []
            datos = json.loads(contenido)
            if isinstance(datos, list):
                return [ConflictReport(**c) for c in datos if isinstance(c, dict)
                        and all(k in c for k in ["requisito_1","requisito_2","tipo_conflicto","descripcion","resolucion_sugerida"])]
        except Exception:
            pass
        return []

    # ─── Punto de entrada ─────────────────────────────────────────────────────

    def priorizar(self, requisitos: List[Dict[str, Any]]) -> PriorizacionResultado:
        resultados, moscow_labels, priority_scores = [], {}, {}

        for req in requisitos:
            dims   = self._evaluar_dimensiones(req)
            score  = self._calcular_score(dims)
            cat    = self._categoria_moscow(score)
            just   = self._justificacion(req.get("id", ""), dims, score, cat)

            moscow_score = MoscowScore(
                requisito_id=req.get("id", ""),
                dimensiones=dims,
                score_final=score,
                categoria_moscow=cat,
                justificacion=just,
            )
            resultados.append(moscow_score)
            moscow_labels[req.get("id", "")] = cat
            priority_scores[req.get("id", "")] = score

        resultados.sort(key=lambda x: x.score_final, reverse=True)
        conflictos = self._detectar_conflictos(requisitos)

        return PriorizacionResultado(
            metadata={
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "metodo": "MoSCoW con Scoring Determinista Multidimensional",
                "pesos": self.PESOS,
                "umbrales": {
                    "must_have":   self.UMBRAL_MUST,
                    "should_have": self.UMBRAL_SHOULD,
                    "could_have":  self.UMBRAL_COULD,
                },
            },
            requisitos_priorizados=[r.model_dump() for r in resultados],
            moscow_labels=moscow_labels,
            conflict_report=[c.model_dump() for c in conflictos],
            priority_scores=priority_scores,
        )
