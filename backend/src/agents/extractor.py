import re
import os
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from utils.schemas import Requisito

# Modelo configurable — llama3.1:8b sigue instrucciones mucho mejor que llama3.2 (3B)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# ─── Sistema de señales con puntuación ───────────────────────────────────────
# Cada señal suma puntos al tipo correspondiente.
# Gana el tipo con más puntos si supera el umbral mínimo.

_SENALES: dict[str, list[tuple[str, int]]] = {
    "Funcional": [
        # "el sistema/software/aplicación debe/puede/permitirá VERB"
        (r"\b(el sistema|el software|la aplicaci[oó]n|el m[oó]dulo|el agente|la ia)\b.{0,25}"
         r"\b(debe|deber[aá]|puede|podr[aá]|permitir[aá]|habilitar[aá])\b.{0,15}"
         r"\b(calcular|enviar|notificar|generar|asignar|detectar|registrar|mostrar|exportar|"
         r"coordinar|procesar|crear|gestionar|buscar|validar|filtrar|bloquear|alertar|"
         r"visualizar|permitir|programar|optimizar|reprogramar|redirigir|autenticar|"
         r"descargar|importar|sincronizar|monitorizar|supervisar|administrar|reasignar|"
         r"recalcular|deshabilitar|habilitar|actualizar)\b", 10),

        # "permitirá al usuario/operador..."
        (r"\bpermitir[aá]\b.{0,10}\b(al|a los)\b.{0,20}"
         r"\b(operador|usuario|cliente|administrador|docente|alumno|decano|profesor)\b", 10),

        # CRUD
        (r"\b(crud|alta,?\s*baja,?\s*modificaci[oó]n|crear,?\s*leer,?\s*actualizar|"
         r"gesti[oó]n de entidades|gesti[oó]n (de|del) (usuario|materia|aula|docente|grupo))\b", 9),

        # Notificación push / alertas al usuario
        (r"\b(notificaci[oó]n push|push notification|notificar (al|a los) (usuario|cliente|operador))\b", 9),

        # Control manual / kill switch
        (r"\b(kill switch|control remoto|tomar el control|control manual|"
         r"modo manual|override|intervenici[oó]n humana)\b", 9),

        # "el operador/usuario puede/podrá VERB"
        (r"\b(el operador|el usuario|el cliente|el administrador|el docente|el alumno)\b"
         r".{0,20}\b(puede|podr[aá]|debe poder|tendr[aá] acceso|podr[aá] marcar)\b", 8),

        # Exportar resultados
        (r"\b(exportar|descargar|generar)\b.{0,30}\b(pdf|excel|csv|json|xml|word|informe|reporte|documento)\b", 8),

        # Verbos en indicativo: "el sistema genera/envía/calcula"
        (r"\b(el sistema|el software)\b.{0,20}"
         r"\b(calcular[aá]|generar[aá]|enviar[aá]|mostrar[aá]|asignar[aá]|detectar[aá]|"
         r"reprogramar[aá]|bloquear[aá]|notificar[aá])\b", 7),

        # Motor / algoritmo
        (r"\b(motor de generaci[oó]n|algoritmo gen[eé]tico|b[uú]squeda tab[uú]|backtracking|"
         r"motor de reglas|motor de validaci[oó]n)\b", 7),
    ],

    "No Funcional": [
        # Latencia en milisegundos
        (r"\d+\s*ms\b", 10),

        # Alta disponibilidad / uptime con porcentaje
        (r"\b9\d[\.,]\d+\s*%", 10),
        (r"\buptime\b.{0,40}\d", 9),
        (r"\bdisponibilidad\b.{0,40}\d+\s*%", 9),
        (r"\b24\s*/\s*7\b", 8),

        # Concurrencia
        (r"\d[\d.,]*\s*(usuarios?|drones?|sesiones?|conexiones?|instancias?)\s*"
         r"(simult[aá]neos?|concurrentes?)", 10),

        # Palabras clave de atributos de calidad
        (r"\b(latencia|throughput|tps|rps|sla)\b", 9),
        (r"\btiempo de (respuesta|carga|procesamiento)\b.{0,30}\d", 9),
        (r"\b(rendimiento|performance)\b.{0,40}\d", 8),
        (r"\b(escalabilidad|escalable)\b.{0,40}(crecimiento|usuarios|aumento|sin degradar)", 8),
        (r"\b(fiabilidad|reliability)\b.{0,30}(99|\d+%)", 7),

        # Seguridad técnica (mecanismo, no ley)
        (r"\b(aes-?\d+|tls\s*\d*|cifrad|encrypt|firmados? digitalmente)\b", 9),
        (r"\b(anti.?spoofing|secuestro de (la unidad|se[nñ]al))\b", 8),

        # Compatibilidad de navegadores
        (r"\b(chrome|firefox|safari|edge|opera)\b.{0,30}\b(compatib|soporta|version)\b", 7),

        # Usabilidad
        (r"\b(drag.and.drop|arrastrar y soltar)\b", 7),
        (r"(validaci[oó]n instant[aá]nea|feedback inmediato)", 7),
        (r"sin (necesidad de )?(formaci[oó]n|conocimientos previos|capacitaci[oó]n)", 6),

        # Tiempo de generación con valor numérico
        (r"\b(generaci[oó]n|procesamiento|c[aá]lculo).{0,30}\d+\s*(segundo|minuto|ms|milisegundo)", 8),
    ],

    "Dominio": [
        # Leyes y normas externas con nombre propio
        (r"\b(rgpd|gdpr|hipaa|lopd|iso\s*\d+|pci.dss|faa|easa|aesa)\b", 10),
        (r"\bnormativa\b.{0,15}\b(a[eé]rea|civil|local|vigente|aplicable)\b", 9),
        (r"\bcumpliendo con (la|las) (normativa|regulaci[oó]n|ley|legislaci[oó]n)\b", 10),
        (r"\b(legislaci[oó]n|regulaci[oó]n) (a[eé]rea|civil|local|vigente)\b", 9),

        # Restricciones físicas del dominio con valores límite
        (r"\b(altitud|altura)\b.{0,25}\b(superior a|m[aá]xima de|l[ií]mite de)\b"
         r".{0,15}\d+\s*(metros?|pies|feet|\bm\b)", 9),
        (r"\b(peso|carga|capacidad de sustentaci[oó]n)\b.{0,25}"
         r"\b(superior a|m[aá]xima de|no puede superar|exceder)\b.{0,15}\d+\s*(kg|kilos?)", 9),
        (r"\bvelocidad del viento\b.{0,40}\d+\s*(km/h|m/s|nudos?)", 9),
        (r"\breserva (de bater[ií]a|energ[eé]tica)\b.{0,30}\d+\s*%", 9),

        # Restricciones de scheduling institucional
        (r"\bhorario\b.{0,30}\b(antes del periodo de|previo a la)\b.{0,15}\bmatr[ií]cula\b", 8),

        # Restricciones tipo "X no puede Y al mismo tiempo"
        (r"\bun (docente|profesor|dron|drone|veh[ií]culo|aula|sala)\b.{0,30}"
         r"\bno puede\b.{0,20}\b(dos|m[uú]ltiples|simult[aá]neo)\b", 8),

        # Reglas de negocio inamovibles con "ningún/ninguna"
        (r"\bninguna ruta (puede ser aprobada|podr[aá] ser aprobada)\b", 9),
        (r"\bno se permitir[aá] el despacho.{0,30}supere\b", 9),

        # Restricciones académicas concretas
        (r"\bcarga horaria (semanal|total)\b.{0,30}(plan de estudios|normativa|reglamento)", 8),
        (r"\buna (asignatura|materia) es impartida por un [uú]nico (profesor|docente)\b", 8),
    ],
}

_UMBRAL_MINIMO = 6


def _pre_clasificar(texto: str) -> str | None:
    """
    Clasifica por puntuación. Devuelve el tipo ganador o None si no hay señal suficiente.
    """
    t = texto.lower()
    scores: dict[str, int] = {"Funcional": 0, "No Funcional": 0, "Dominio": 0}

    for tipo, senales in _SENALES.items():
        for pattern, weight in senales:
            try:
                if re.search(pattern, t, re.IGNORECASE):
                    scores[tipo] += weight
            except re.error:
                pass

    max_score = max(scores.values())
    if max_score < _UMBRAL_MINIMO:
        return None

    return max(scores, key=lambda k: scores[k])


# ─── Agente extractor ─────────────────────────────────────────────────────────

class AgenteRequisitos:
    def __init__(self):
        self.llm = ChatOllama(model=OLLAMA_MODEL, temperature=0, format="json")
        self.parser = JsonOutputParser(pydantic_object=Requisito)

    def _limpiar_texto(self, texto: str) -> str:
        """Extrae solo la parte del requisito, eliminando contexto de proyecto."""
        t = texto.strip()
        for prefijo in ["Requisito del usuario:", "Requisito:", "Usuario:", "Contexto del proyecto:"]:
            if t.lower().startswith(prefijo.lower()):
                t = t[len(prefijo):].strip()
        # Si viene "contexto\n\nrequisito", quedarse solo con la última parte
        if "\n\n" in t:
            t = t.split("\n\n")[-1].strip()
        return t

    def _generar_descripcion(self, texto: str, tipo: str) -> dict:
        """Pide al LLM SOLO descripción técnica y criterio de aceptación."""
        etiqueta = {
            "Funcional": "Requisito Funcional (RF): acción que el sistema ejecuta",
            "No Funcional": "Requisito No Funcional (RNF): atributo de calidad del sistema",
            "Dominio": "Restricción de Dominio (RD): regla externa o física que el sistema no puede violar",
        }[tipo]

        prompt = ChatPromptTemplate.from_template(
            """Eres un redactor técnico de requisitos de software. El tipo ya está determinado.

TIPO: {etiqueta}
TEXTO ORIGINAL: "{entrada}"

Genera una descripción técnica clara y un criterio de aceptación concreto.

Reglas de redacción:
- Descripción: empieza con "El sistema debe..." (RF/RNF) o con la restricción directa (RD)
- Criterio: condición específica y verificable, no una frase genérica
- Prioridad: Alta si es crítico, Media si es importante, Baja si es deseable

Responde SOLO con este JSON:
{{
  "tipo": "{tipo}",
  "descripcion": "descripcion tecnica clara",
  "prioridad": "Alta",
  "criterio_aceptacion": "condicion concreta y verificable"
}}"""
        )
        result = (prompt | self.llm | self.parser).invoke({
            "entrada": texto,
            "tipo": tipo,
            "etiqueta": etiqueta,
        })
        result["tipo"] = tipo  # forzar siempre
        return result

    def _clasificar_con_llm(self, texto: str) -> dict:
        """Fallback: el LLM clasifica Y redacta. Solo para casos ambiguos."""
        prompt = ChatPromptTemplate.from_template(
            """Clasifica este texto como requisito de software. Responde SOLO con JSON.

TEXTO: "{entrada}"

TIPOS:
- "Funcional": el sistema ejecuta una acción (debe calcular, debe enviar, debe gestionar, permite al usuario...)
- "No Funcional": atributo de calidad medible (velocidad, disponibilidad %, latencia ms, usuarios concurrentes, seguridad técnica)
- "Dominio": restricción física, legal o institucional inamovible (leyes con nombre, límites físicos del hardware/entorno)

IMPORTANTE: La mayoría de requisitos son Funcionales. Solo usa Dominio para restricciones del mundo real que el sistema no puede cambiar (alturas máximas de vuelo, normativas legales con nombre, capacidad física de motores).

{{
  "tipo": "Funcional",
  "descripcion": "El sistema debe [accion concreta]",
  "prioridad": "Alta",
  "criterio_aceptacion": "condicion verificable y especifica"
}}"""
        )
        return (prompt | self.llm | self.parser).invoke({"entrada": texto})

    def procesar_texto(self, texto_usuario: str) -> Requisito:
        texto_req = self._limpiar_texto(texto_usuario)

        # 1. Pre-clasificar con reglas deterministas
        tipo_detectado = _pre_clasificar(texto_req)

        if tipo_detectado:
            # Tipo conocido → LLM solo redacta descripción y criterio
            resultado = self._generar_descripcion(texto_req, tipo_detectado)
        else:
            # Caso ambiguo → LLM clasifica y redacta
            resultado = self._clasificar_con_llm(texto_req)

        return Requisito(
            id="TEMP",
            tipo=resultado.get("tipo", tipo_detectado or "Funcional"),
            descripcion=resultado.get("descripcion", texto_req),
            prioridad=resultado.get("prioridad", "Media"),
            criterio_aceptacion=resultado.get(
                "criterio_aceptacion", "Validar que el sistema cumple con el requisito"
            ),
        )
