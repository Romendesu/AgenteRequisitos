import spacy
import re
import subprocess
import json
import os
from spacy.tokens import Doc, Span
from typing import List, Dict, Any, Optional, Tuple


# ─────────────────────────────────────────────
#  CONFIGURACIÓN CENTRAL
# ─────────────────────────────────────────────

CONFIDENCE_THRESHOLD = 0.6   # Por debajo → fallback al LLM
OUTPUT_ROUTE = "../data/input/lista_necesidades.json"

REQUIREMENT_PATTERNS = [
    r"\bel sistema debe\b",
    r"\bla aplicación debe\b",
    r"\bel (sistema|módulo|servicio|backend|frontend|api)\b",
    r"\bse requiere\b",
    r"\bse necesita\b",
    r"\bdebe (poder|ser capaz de|permitir|gestionar|procesar|validar|enviar|recibir|mostrar|almacenar)\b",
    r"\bel usuario (puede|podrá|debe poder|necesita|requiere|quiere)\b",
    r"\bpermitir (al|que el) usuario\b",
    r"\btendrá (que|la capacidad)\b",
    r"\bencargado de\b",
    r"\bresponsable de\b",
    r"\bgestionar(á)?\b",
    r"\bprocesar(á)?\b",
    r"\bvalidar(á)?\b",
    r"\bnotificar(á)?\b",
]

NONFUNCTIONAL_PATTERNS = [
    r"\b(rendimiento|performance|velocidad|rapidez|tiempo de respuesta)\b",
    r"\b(seguridad|cifrado|autenticación|autorización)\b",
    r"\b(escalabilidad|escalable)\b",
    r"\b(disponibilidad|uptime|fiabilidad)\b",
    r"\b(usabilidad|accesibilidad|ux|interfaz)\b",
    r"\b(mantenibilidad|modularidad|código limpio)\b",
    r"\b(portabilidad|compatibilidad)\b",
]

AMBIGUITY_TERMS = [
    "rápido", "eficiente", "fácil", "intuitivo", "mejor", "óptimo",
    "flexible", "robusto", "moderno", "simple", "bonito", "estable",
    "potente", "completo", "adecuado", "suficiente", "bueno", "seguro",
    "escalable",   # ambiguo sin cifras concretas
    "fácil de usar",
    "amigable",
]

# Actores canónicos por dominio; si el texto menciona alguno se usa directamente
KNOWN_ACTORS = [
    "sistema", "aplicación", "app", "plataforma", "servicio", "api",
    "backend", "frontend", "servidor", "módulo", "motor", "base de datos",
    "usuario", "administrador", "admin", "cliente", "operador",
    "gestor", "agente",
]


# ─────────────────────────────────────────────
#  UTILIDADES LINGÜÍSTICAS
# ─────────────────────────────────────────────

def _closest_known_actor(token_text: str) -> Optional[str]:
    """Mapea texto libre a un actor canónico si hay coincidencia parcial."""
    t = token_text.lower()
    for actor in KNOWN_ACTORS:
        if actor in t or t in actor:
            return actor
    return None


def _verb_chain(root) -> str:
    """
    Reconstruye la cadena verbal completa a partir del ROOT:
    auxiliary + modal + main verb + xcomp (infinitivo dependiente).
    Ejemplo: 'debe poder enviar' en vez de sólo 'debe'.
    """
    parts = []

    # Auxiliares y modales que preceden al ROOT
    for child in root.children:
        if child.dep_ in ("aux", "auxpass") and child.i < root.i:
            parts.append(child.lemma_)

    parts.append(root.lemma_)

    # Complemento verbal (xcomp → infinitivo)
    for child in root.children:
        if child.dep_ == "xcomp" and child.pos_ == "VERB":
            parts.append(child.lemma_)
            # Un nivel más de profundidad (p.ej. "debe poder empezar a procesar")
            for grandchild in child.children:
                if grandchild.dep_ == "xcomp" and grandchild.pos_ == "VERB":
                    parts.append(grandchild.lemma_)

    return " ".join(parts)


def _extract_object(root) -> Optional[str]:
    """
    Extrae el objeto directo (obj, dobj) o el complemento nominal
    más relevante del verbo raíz.
    """
    for child in root.children:
        if child.dep_ in ("obj", "dobj", "obl"):
            # Devuelve la frase nominal completa (núcleo + modificadores adjetivales)
            phrase_tokens = [child] + [
                t for t in child.subtree
                if t.dep_ in ("amod", "compound", "nmod") and t.i != child.i
            ]
            phrase_tokens.sort(key=lambda t: t.i)
            return " ".join(t.text for t in phrase_tokens)
    return None


# ─────────────────────────────────────────────
#  CLASE PRINCIPAL
# ─────────────────────────────────────────────

class IntakeAgent:

    def __init__(self):
        self.nlp = spacy.load("es_core_news_sm")

    # ── 1. PROCESAMIENTO ────────────────────────────────────────────

    def process_text(self, text: str) -> Doc:
        if not text or not isinstance(text, str):
            raise ValueError("El texto de entrada es inválido o está vacío.")
        # Normalización mínima: colapsar espacios múltiples, trim
        text = re.sub(r"\s+", " ", text).strip()
        return self.nlp(text)

    # ── 2. DETECCIÓN DE INTENCIÓN / TIPO DE REQUISITO ───────────────

    def detect_requirement_type(self, sent: Span) -> str:
        """
        Clasifica la sentencia como 'functional', 'non_functional' o 'noise'.
        Orden de prioridad: regex explícitos > heurísticas sintácticas.
        """
        text_low = sent.text.lower()

        # No funcional primero (más restrictivo)
        if any(re.search(p, text_low) for p in NONFUNCTIONAL_PATTERNS):
            return "non_functional"

        # Funcional por patrón explícito
        if any(re.search(p, text_low) for p in REQUIREMENT_PATTERNS):
            return "functional"

        # Heurística: sujeto + verbo de acción (excluyendo verbos cópula)
        has_verb = any(
            token.pos_ == "VERB" and token.lemma_ not in ("ser", "estar", "haber", "tener")
            for token in sent
        )
        has_subject = any(token.dep_ in ("nsubj", "nsubj:pass") for token in sent)

        if has_verb and has_subject:
            return "functional"
        if has_verb:
            return "functional"   # actor implícito, se resolverá después

        return "noise"

    # ── 3. EXTRACCIÓN DE ACTOR ──────────────────────────────────────

    def extract_actor(self, sent: Span) -> str:
        """
        Estrategia en cascada para identificar el actor:
        1. Sujeto gramatical explícito (nsubj / nsubj:pass)
        2. Frase nominal más próxima a un actor canónico conocido
        3. Actor implícito inferido de patrones de texto ('el usuario puede',
           'se requiere que', etc.)
        4. Fallback: 'sistema'
        """
        text_low = sent.text.lower()

        # Paso 1: sujeto gramatical
        for token in sent:
            if token.dep_ in ("nsubj", "nsubj:pass"):
                canonical = _closest_known_actor(token.text)
                return canonical if canonical else token.text.lower()

        # Paso 2: mención directa de actor canónico (sin ser sujeto gramatical)
        for actor in KNOWN_ACTORS:
            pattern = rf"\b{re.escape(actor)}\b"
            if re.search(pattern, text_low):
                return actor

        # Paso 3: inferencia por patrón
        if re.search(r"\bel usuario\b", text_low):
            return "usuario"
        if re.search(r"\bse requiere\b|\bse necesita\b|\bse debe\b", text_low):
            return "sistema"
        if re.search(r"\bpermitir\b|\bhabilitar\b", text_low):
            return "sistema"

        return "sistema"

    # ── 4. EXTRACCIÓN DE ACCIÓN ─────────────────────────────────────

    def extract_action(self, sent: Span) -> Tuple[Optional[str], Optional[str]]:
        """
        Devuelve (acción_completa, objeto_directo).
        Usa la cadena verbal completa (aux + modal + ROOT + xcomp).
        """
        roots = [token for token in sent if token.dep_ == "ROOT"]
        if not roots:
            return None, None

        root = roots[0]

        # Si el ROOT es un verbo, construir cadena completa
        if root.pos_ == "VERB":
            action = _verb_chain(root)
            obj = _extract_object(root)
            return action, obj

        # Si el ROOT no es verbo (p.ej. oración nominal), buscar verbo principal
        verbs = [t for t in sent if t.pos_ == "VERB"]
        if verbs:
            main_verb = max(verbs, key=lambda t: len(list(t.children)))
            action = _verb_chain(main_verb)
            obj = _extract_object(main_verb)
            return action, obj

        return None, None

    # ── 5. EXTRACCIÓN DE RESTRICCIONES ─────────────────────────────

    def extract_constraints(self, sent: Span) -> Dict[str, Any]:
        """
        Detecta restricciones cuantificables en la sentencia:
        tiempo, número de usuarios, tamaño, porcentaje, etc.
        """
        constraints = {}
        text = sent.text

        patterns = {
            "duracion":       r"\b(\d+[\.,]?\d*)\s*(segundos?|minutos?|horas?|días?|semanas?|ms|milisegundos?)\b",
            "usuarios":       r"\b(\d+[\.,]?\d*)\s*(usuarios?|clientes?|sesiones?)\s*(concurrentes?|simultáneos?)?\b",
            "tamano":         r"\b(\d+[\.,]?\d*)\s*(kb|mb|gb|tb|bytes?|registros?|elementos?)\b",
            "porcentaje":     r"\b(\d+[\.,]?\d*)\s*(%|por ciento)\b",
            "disponibilidad": r"\b(\d{2,3}[.,]\d+)\s*%\s*de\s*(disponibilidad|uptime)\b",
            "frecuencia":     r"\b(\d+[\.,]?\d*)\s*(veces?|peticiones?|requests?)\s*(por\s*(segundo|minuto|hora|día))?\b",
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                constraints[key] = match.group(0).strip()

        return constraints

    # ── 6. DETECCIÓN DE AMBIGÜEDAD ──────────────────────────────────

    def detect_ambiguity(self, sentence: str) -> List[str]:
        """
        Retorna términos vagos encontrados en la sentencia.
        También detecta frases multi-palabra.
        """
        found = []
        low = sentence.lower()
        for term in AMBIGUITY_TERMS:
            if re.search(rf"\b{re.escape(term)}\b", low):
                found.append(term)
        return found

    # ── 7. SCORE DE CONFIANZA ───────────────────────────────────────

    def confidence_score(self, sent: Span, actor: str, action: Optional[str]) -> float:
        """
        Puntuación 0-1 que mide qué tan bien se pudo estructurar la sentencia.
        Se usa para decidir si escalar al LLM.
        """
        score = 0.0
        tokens = list(sent)
        total = len(tokens) if tokens else 1

        has_nsubj    = any(t.dep_ in ("nsubj", "nsubj:pass") for t in tokens)
        has_verb     = any(t.pos_ == "VERB" for t in tokens)
        has_object   = any(t.dep_ in ("obj", "dobj", "obl") for t in tokens)
        actor_known  = actor in KNOWN_ACTORS
        action_found = action is not None and len(action.split()) >= 1

        score += 0.25 if has_nsubj   else 0.0
        score += 0.25 if action_found else 0.0
        score += 0.15 if has_object  else 0.0
        score += 0.15 if actor_known else 0.05   # ligero crédito si se infirió
        score += 0.10 if has_verb    else 0.0

        # Penalización por sentencias muy cortas (poco contexto)
        if total < 4:
            score *= 0.6

        # Penalización si hay muchos términos ambiguos
        ambiguities = self.detect_ambiguity(sent.text)
        score -= 0.05 * len(ambiguities)

        return max(0.0, min(1.0, score))

    # ── 8. FALLBACK LLM ─────────────────────────────────────────────

    def refine_with_llm(self, text: str, actor_hint: str, action_hint: Optional[str]) -> Dict[str, Any]:
        """
        Invoca Mistral vía Ollama para extraer estructura cuando
        el análisis sintáctico tiene baja confianza.
        Devuelve un dict con actor, action, type, constraints o un error.
        """
        prompt = f"""Eres un experto en ingeniería de requisitos de software.
Analiza el siguiente texto y extrae la información solicitada.

Texto: "{text}"

Contexto previo (puede estar incompleto):
- Actor detectado: {actor_hint}
- Acción detectada: {action_hint or 'desconocida'}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta estructura:
{{
  "actor": "<quién realiza o sobre quién recae la acción>",
  "action": "<acción o proceso principal>",
  "object": "<sobre qué o qué cosa>",
  "type": "functional | non_functional",
  "constraints": {{}},
  "clarification_needed": "<pregunta de aclaración si el texto es muy ambiguo, o null>"
}}"""

        try:
            result = subprocess.run(
                ["ollama", "run", "mistral"],
                input=prompt.encode("utf-8"),
                capture_output=True,
                timeout=30,
            )
            raw = result.stdout.decode("utf-8").strip()
            # Extraer JSON aunque haya texto extra
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"error": "LLM no devolvió JSON válido", "raw": raw}
        except subprocess.TimeoutExpired:
            return {"error": "LLM timeout (>30s)"}
        except FileNotFoundError:
            return {"error": "Ollama no instalado o fuera de PATH"}
        except json.JSONDecodeError as e:
            return {"error": f"JSON inválido: {e}"}
        except Exception as e:
            return {"error": str(e)}

    # ── 9. CONSTRUCCIÓN DEL CANDIDATO ───────────────────────────────

    def build_requirement_candidate(self, sent: Span) -> Dict[str, Any]:
        """
        Integra todos los pasos de extracción en un RequirementCandidate.
        Incluye metadata de calidad (confidence, llm_used).
        """
        req_type          = self.detect_requirement_type(sent)
        actor             = self.extract_actor(sent)
        action, obj       = self.extract_action(sent)
        constraints       = self.extract_constraints(sent)
        confidence        = self.confidence_score(sent, actor, action)
        ambiguities       = self.detect_ambiguity(sent.text)

        candidate: Dict[str, Any] = {
            "text":        sent.text,
            "actor":       actor,
            "action":      action,
            "object":      obj,
            "type":        req_type,
            "constraints": constraints,
            "confidence":  round(confidence, 2),
            "llm_used":    False,
        }

        # Escalar al LLM si la confianza es baja o si no se extrajo acción
        if confidence < CONFIDENCE_THRESHOLD or action is None:
            llm_result = self.refine_with_llm(sent.text, actor, action)
            if "error" not in llm_result:
                candidate["actor"]       = llm_result.get("actor", actor)
                candidate["action"]      = llm_result.get("action", action)
                candidate["object"]      = llm_result.get("object", obj)
                candidate["type"]        = llm_result.get("type", req_type)
                candidate["constraints"] = {
                    **constraints,
                    **llm_result.get("constraints", {}),
                }
                if llm_result.get("clarification_needed"):
                    candidate["clarification_needed"] = llm_result["clarification_needed"]
                candidate["llm_used"] = True
            else:
                candidate["llm_error"] = llm_result["error"]

        if ambiguities:
            candidate["ambiguities"] = ambiguities

        return candidate

    # ── 10. ENTIDADES NER ────────────────────────────────────────────

    def extract_entities(self, doc: Doc) -> Dict[str, List[str]]:
        entity_map: Dict[str, List[str]] = {}
        for ent in doc.ents:
            entity_map.setdefault(ent.label_, [])
            if ent.text not in entity_map[ent.label_]:
                entity_map[ent.label_].append(ent.text)
        return entity_map

    # ── 11. PIPELINE PRINCIPAL ───────────────────────────────────────

    def run(self, text: str) -> Dict[str, Any]:
        """
        Ejecuta el pipeline completo y devuelve el objeto estructurado.
        """
        doc = self.process_text(text)

        lista_necesidades: List[Dict[str, Any]] = []
        ambiguity_flags: List[Dict[str, Any]] = []

        for sent in doc.sents:
            candidate = self.build_requirement_candidate(sent)

            # Filtrar ruido puro (sentencias sin verbo y sin patrón)
            if candidate["type"] == "noise" and not candidate.get("llm_used"):
                continue

            lista_necesidades.append(candidate)

            if candidate.get("ambiguities"):
                ambiguity_flags.append({
                    "text":   sent.text,
                    "issues": candidate["ambiguities"],
                })

        entity_map = self.extract_entities(doc)

        return {
            "lista_necesidades": lista_necesidades,
            "ambiguity_flags":   ambiguity_flags,
            "entity_map":        entity_map,
            "stats": {
                "total_sentences":   sum(1 for _ in doc.sents),
                "requirements_found": len(lista_necesidades),
                "llm_calls":         sum(1 for c in lista_necesidades if c.get("llm_used")),
                "avg_confidence":    round(
                    sum(c["confidence"] for c in lista_necesidades) / len(lista_necesidades), 2
                ) if lista_necesidades else 0.0,
            },
        }

    # ── 12. PERSISTENCIA ─────────────────────────────────────────────

    @staticmethod
    def save_data(data: Dict[str, Any]) -> None:
        os.makedirs(os.path.dirname(OUTPUT_ROUTE), exist_ok=True)
        with open(OUTPUT_ROUTE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"[IntakeAgent] Guardado en {OUTPUT_ROUTE}")


# ─────────────────────────────────────────────
#  ENTRYPOINT
# ─────────────────────────────────────────────

def main():
    print("=== Intake Agent v2 ===")
    print("Ingrese el texto (termine con una línea vacía y Enter):")
    lines = []
    while True:
        line = input()
        if line == "":
            break
        lines.append(line)
    user_input = " ".join(lines)

    agent = IntakeAgent()
    data  = agent.run(user_input)

    # Mostrar resumen en consola
    print(f"\n[Stats] {data['stats']}")
    for i, req in enumerate(data["lista_necesidades"], 1):
        print(f"\n--- Requisito {i} (conf: {req['confidence']}) ---")
        print(f"  Texto:  {req['text']}")
        print(f"  Actor:  {req['actor']}")
        print(f"  Acción: {req['action']}")
        print(f"  Objeto: {req.get('object')}")
        print(f"  Tipo:   {req['type']}")
        if req.get("constraints"):
            print(f"  Restricciones: {req['constraints']}")
        if req.get("ambiguities"):
            print(f"  ⚠ Ambigüedades: {req['ambiguities']}")
        if req.get("clarification_needed"):
            print(f"  ❓ Aclaración sugerida: {req['clarification_needed']}")
        if req.get("llm_used"):
            print(f"  🤖 Refinado por LLM")

    agent.save_data(data)


if __name__ == "__main__":
    main()