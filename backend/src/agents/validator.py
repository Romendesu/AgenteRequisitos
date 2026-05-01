import json
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class EvaluacionCalidad(BaseModel):
    puntuacion: int = Field(description="Puntuacion de 1 a 10")
    errores_detectados: list = Field(description="Lista de problemas encontrados")
    sugerencias_mejora: str = Field(description="Como redactar el requisito de forma tecnica")
    es_valido: bool = Field(description="True si la puntuacion es > 7")

class AgenteValidador:
    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", temperature=0, format="json")

    def validar(self, requisito_texto):
        prompt = ChatPromptTemplate.from_template(
            """Eres un Inspector de Calidad de Software experto en ISO/IEC 29148.
            Evalúa el siguiente REQUISITO: "{texto}"
            
            Responde ÚNICAMENTE con un objeto JSON con esta estructura:
            {{
                "puntuacion": 1-10,
                "errores_detectados": ["error1", "error2"],
                "sugerencias_mejora": "texto",
                "es_valido": true/false
            }}
            """
        )
        
        chain = prompt | self.llm
        
        # Invocamos al modelo
        respuesta = chain.invoke({"texto": requisito_texto})
        
        # Parseamos el JSON manualmente para evitar errores de esquema
        datos = json.loads(respuesta.content)
        
        # Retornamos el objeto Pydantic mapeando los datos del JSON
        return EvaluacionCalidad(**datos)