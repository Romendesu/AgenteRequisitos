from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from src.utils.schemas import Requisito


class AgenteRequisitos:
    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", temperature=0, format="json")
        self.parser = JsonOutputParser(pydantic_object=Requisito)
        # Contadores simples
        self.contador_funcional = 0
        self.contador_no_funcional = 0
        self.contador_dominio = 0
    
    def _generar_id(self, tipo: str) -> str:
        """Genera un ID basado en el tipo de requisito."""
        if "Funcional" in tipo:
            self.contador_funcional += 1
            return f"RF-{self.contador_funcional:02d}"
        elif "No Funcional" in tipo or "No Funcional" in tipo:
            self.contador_no_funcional += 1
            return f"RNF-{self.contador_no_funcional:02d}"
        elif "Dominio" in tipo:
            self.contador_dominio += 1
            return f"RD-{self.contador_dominio:02d}"
        else:
            self.contador_funcional += 1
            return f"RF-{self.contador_funcional:02d}"

    def procesar_texto(self, texto_usuario):
        prompt = ChatPromptTemplate.from_template(
            """Eres un Ingeniero de Requisitos. Tu objetivo es convertir el texto del usuario en un objeto JSON tecnico.
            
            TEXTO DEL USUARIO: "{entrada}"
            
            IMPORTANTE: Clasifica correctamente el tipo:
            - Si describe una ACCION que el sistema debe realizar -> tipo: "Funcional"
            - Si describe una CUALIDAD o RESTRICCION (rendimiento, seguridad, usabilidad, disponibilidad) -> tipo: "No Funcional"
            - Si describe una REGLA DE NEGOCIO o requisito LEGAL -> tipo: "Dominio"
            
            ANALISIS DE PRIORIDAD:
            - "Alta": Funcion critica, sin ella el sistema no funciona o hay perdida economica/legal
            - "Media": Importante pero hay alternativas o workarounds
            - "Baja": Mejora o funcionalidad deseable, no critica
            
            Debes responder UNICAMENTE con el JSON siguiendo esta estructura:
            {{
                "tipo": "Funcional, No Funcional o Dominio",
                "descripcion": "Descripcion clara y especifica del requisito",
                "prioridad": "Alta, Media o Baja",
                "criterio_aceptacion": "Como probar o validar que este requisito se cumplio"
            }}
            
            NO incluyas el campo "id" en tu respuesta. El sistema lo asignara automaticamente.
            """
        )

        chain = prompt | self.llm | self.parser
        
        resultado_dict = chain.invoke({
            "entrada": texto_usuario
        })
        
        # Generar ID basado en el tipo detectado
        tipo_detectado = resultado_dict.get("tipo", "Funcional")
        id_generado = self._generar_id(tipo_detectado)
        
        # Crear el objeto Requisito con el ID generado
        return Requisito(
            id=id_generado,
            tipo=resultado_dict.get("tipo", "Funcional"),
            descripcion=resultado_dict.get("descripcion", texto_usuario),
            prioridad=resultado_dict.get("prioridad", "Media"),
            criterio_aceptacion=resultado_dict.get("criterio_aceptacion", "Validar que el sistema cumple con el requisito")
        )