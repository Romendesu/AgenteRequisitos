import spacy
import re
import subprocess
from spacy.tokens import Doc
from typing import List, Dict, Any

class IntakeAgent:
    def __init__(self):
        self.nlp = spacy.load("es_core_news_sm")

        self.requirement_patterns = [
            r"\bel sistema debe\b",
            r"\bla aplicación debe\b",
            r"\bse requiere\b",
            r"\bel usuario puede\b"
        ]

        self.ambiguity_terms = [
            "rápido", "eficiente", "fácil", "intuitivo",
            "mejor", "óptimo", "flexible"
        ]

    # PROCESAMIENTO
    def process_text(self, text: str) -> Doc:
        if not text or not isinstance(text, str):
            raise ValueError("Input inválido")
        return self.nlp(text)

    # DETECCIÓN INTELIGENTE
    def detect_requirement(self, sent) -> bool:
        text = sent.text.lower()

        # Regla directa
        if any(re.search(p, text) for p in self.requirement_patterns):
            return True

        # Heurística: verbo principal → probable funcional
        return any(token.pos_ == "VERB" for token in sent)

    # ACTOR + ACCIÓN 
    def extract_actor_action(self, sent) -> Dict[str, Any]:
        actor = None
        action = None

        # ROOT = verbo principal
        root = [token for token in sent if token.dep_ == "ROOT"]
        if root:
            action = root[0].lemma_

        for token in sent:
            if token.dep_ in ("nsubj", "nsubj:pass"):
                actor = token.text

        if not actor:
            actor = "sistema"

        return {"actor": actor, "action": action}

    # CONSTRAINTS 
    def extract_constraints(self, sent) -> Dict[str, Any]:
        constraints = {}

        match = re.search(r"\b\d+\s*horas?\b", sent.text.lower())
        if match:
            constraints["duracion"] = match.group()

        return constraints

    # AMBIGÜEDAD
    def detect_ambiguity(self, sentence: str) -> List[str]:
        return [t for t in self.ambiguity_terms if t in sentence.lower()]

    # LLM LOCAL (SOLO SI NECESARIO)
    def refine_with_llm(self, text: str) -> Dict[str, Any]:
        prompt = f"""
        Extrae actor, acción, tipo y restricciones de:
        "{text}"
        Responde en JSON.
        """

        try:
            result = subprocess.run(
                ["ollama", "run", "mistral"],
                input=prompt.encode(),
                capture_output=True
            )
            return result.stdout.decode()
        except:
            return {"error": "LLM no disponible"}

    # NORMALIZACIÓN
    def build_requirement_candidate(self, sent) -> Dict[str, Any]:
        actor_action = self.extract_actor_action(sent)
        constraints = self.extract_constraints(sent)

        candidate = {
            "text": sent.text,
            "actor": actor_action["actor"],
            "action": actor_action["action"],
            "type": "functional" if self.detect_requirement(sent) else "non_functional",
            "constraints": constraints
        }

        # Si es débil → usar LLM
        if candidate["action"] is None:
            candidate["llm_refined"] = self.refine_with_llm(sent.text)

        return candidate

    # PIPELINE
    def run(self, text: str) -> Dict[str, Any]:
        doc = self.process_text(text)

        lista_necesidades = []
        ambiguity_flags = []

        for sent in doc.sents:
            candidate = self.build_requirement_candidate(sent)
            lista_necesidades.append(candidate)

            ambiguities = self.detect_ambiguity(sent.text)
            if ambiguities:
                ambiguity_flags.append({
                    "text": sent.text,
                    "issues": ambiguities
                })

        entity_map = self.extract_entities(doc)

        return {
            "lista_necesidades": lista_necesidades,
            "ambiguity_flags": ambiguity_flags,
            "entity_map": entity_map
        }
        
    def extract_entities(self, doc: Doc) -> Dict[str, List[str]]:
        entity_map = {}

        for ent in doc.ents:
            if ent.label_ not in entity_map:
                entity_map[ent.label_] = []
            entity_map[ent.label_].append(ent.text)

        return entity_map

def main():
    user_input = input("Ingrese el prompt:")
    agent = IntakeAgent()
    print(agent.run(user_input))

if __name__ == "__main__":
    main()