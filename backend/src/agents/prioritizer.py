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
        "impacto_negocio":  0.30,
        "riesgo_tecnico":   0.25,
        "esfuerzo_estimado": 0.25,
        "dependencias":     0.20,
    }

    # Distribución objetivo por rango relativo (porcentajes aproximados)
    # Los umbrales absolutos solo aplican como floor/ceiling extremos
    DIST_MUST   = 0.30   # top 30% → Must Have
    DIST_SHOULD = 0.35   # siguiente 35% → Should Have
    DIST_COULD  = 0.25   # siguiente 25% → Could Have
    # bottom 10% → Won't Have

    # Floors absolutos: score muy bajo → Won't Have sin importar ranking
    FLOOR_WONT  = 1.8

    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", temperature=0.2, format="json")

    # ─── Scoring determinista (no depende del LLM) ────────────────────────────

    def _evaluar_dimensiones(self, req: Dict[str, Any]) -> DimensionScores:
        prioridad = req.get("prioridad", "Media").strip()
        tipo      = req.get("tipo", "Funcional").strip()
        desc      = (req.get("descripcion", "") + " " + req.get("criterio_aceptacion", "")).lower()

        es_nf = "No Funcional" in tipo
        es_dominio = "Dominio" in tipo

        # 1. Impacto de negocio
        # Partimos de la prioridad declarada pero la escala es más conservadora:
        # Alta → 4 (no 5) para dejar margen de diferenciación
        base_impacto = {"Alta": 4, "Media": 3, "Baja": 1}.get(prioridad, 3)
        # Keywords verdaderamente críticos suben al máximo
        critical_hits = sum(1 for k in _KEYWORDS_CRITICO if k in desc)
        if critical_hits >= 2:
            base_impacto = min(5, base_impacto + 1)
        elif critical_hits == 0 and es_nf:
            # RNF sin keywords críticos: impacto medio-bajo por defecto
            base_impacto = max(1, base_impacto - 1)
        if any(k in desc for k in _KEYWORDS_WONT):
            base_impacto = max(1, base_impacto - 2)

        # 2. Riesgo técnico — complejidad real del requisito
        complex_hits = sum(1 for k in _KEYWORDS_COMPLEJO if k in desc)
        if complex_hits >= 2:
            riesgo = 5
        elif complex_hits == 1:
            riesgo = 4
        elif any(k in desc for k in _KEYWORDS_SIMPLE):
            riesgo = 2
        elif es_dominio:
            riesgo = 2   # Restricciones de dominio: bajo riesgo de impl.
        else:
            riesgo = 3

        # 3. Esfuerzo estimado — mayor esfuerzo baja el score
        if es_dominio:
            esfuerzo = 2   # Constraints: se validan, no implementan
        elif complex_hits >= 2:
            esfuerzo = 5
        elif complex_hits == 1:
            esfuerzo = 4
        elif any(k in desc for k in _KEYWORDS_SIMPLE):
            esfuerzo = 2
        elif prioridad == "Baja" and any(k in desc for k in _KEYWORDS_WONT):
            esfuerzo = 5
        elif es_nf:
            esfuerzo = 3
        else:
            esfuerzo = 3

        # 4. Dependencias — cuántos otros requisitos dependen de este
        core_hits = sum(1 for k in _KEYWORDS_CORE if k in desc)
        if core_hits >= 2:
            dependencias = 5
        elif core_hits == 1:
            dependencias = 4
        elif es_nf:
            dependencias = 2   # RNF raramente bloquean funcionales
        elif es_dominio:
            dependencias = 3   # Constraints: los demás deben respetarlas
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

    def _categorizar_todos(self, scored: List[tuple]) -> Dict[str, str]:
        """
        Distribución relativa: ordena por score y reparte en categorías usando
        porcentajes objetivo. Scores < FLOOR_WONT van a Won't Have sin importar ranking.
        """
        if not scored:
            return {}

        wont_abs = [(rid, s) for rid, s in scored if s < self.FLOOR_WONT]
        activos  = sorted([(rid, s) for rid, s in scored if s >= self.FLOOR_WONT],
                          key=lambda x: x[1], reverse=True)

        n = len(activos)
        must_n   = max(1, round(n * self.DIST_MUST))   if n > 0 else 0
        should_n = max(1, round(n * self.DIST_SHOULD)) if n > 0 else 0
        could_n  = max(1, round(n * self.DIST_COULD))  if n > 0 else 0

        labels: Dict[str, str] = {}
        for rid, _ in wont_abs:
            labels[rid] = "Won't Have"
        for i, (rid, _) in enumerate(activos):
            if i < must_n:
                labels[rid] = "Must Have"
            elif i < must_n + should_n:
                labels[rid] = "Should Have"
            elif i < must_n + should_n + could_n:
                labels[rid] = "Could Have"
            else:
                labels[rid] = "Won't Have"

        return labels

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
        priority_scores: Dict[str, float] = {}
        dims_map: Dict[str, DimensionScores] = {}

        for req in requisitos:
            req_id = req.get("id", "")
            dims   = self._evaluar_dimensiones(req)
            score  = self._calcular_score(dims)
            priority_scores[req_id] = score
            dims_map[req_id] = dims

        # Categorización relativa — evita que todo caiga en Must Have
        rel_labels = self._categorizar_todos(list(priority_scores.items()))

        resultados: List[MoscowScore] = []
        moscow_labels: Dict[str, str] = {}

        for req in requisitos:
            req_id = req.get("id", "")
            dims   = dims_map[req_id]
            score  = priority_scores[req_id]
            cat    = rel_labels.get(req_id, "Could Have")
            just   = self._justificacion(req_id, dims, score, cat)

            moscow_score = MoscowScore(
                requisito_id=req_id,
                dimensiones=dims,
                score_final=score,
                categoria_moscow=cat,
                justificacion=just,
            )
            resultados.append(moscow_score)
            moscow_labels[req_id] = cat

        resultados.sort(key=lambda x: x.score_final, reverse=True)
        conflictos = self._detectar_conflictos(requisitos)

        return PriorizacionResultado(
            metadata={
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "metodo": "MoSCoW con Scoring Multidimensional y Distribución Relativa",
                "pesos": self.PESOS,
                "distribucion_objetivo": {
                    "must_have":   f"{int(self.DIST_MUST*100)}%",
                    "should_have": f"{int(self.DIST_SHOULD*100)}%",
                    "could_have":  f"{int(self.DIST_COULD*100)}%",
                    "wont_have":   f"{int((1-self.DIST_MUST-self.DIST_SHOULD-self.DIST_COULD)*100)}%",
                },
            },
            requisitos_priorizados=[r.model_dump() for r in resultados],
            moscow_labels=moscow_labels,
            conflict_report=[c.model_dump() for c in conflictos],
            priority_scores=priority_scores,
        )
