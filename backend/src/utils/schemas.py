from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal

TIPOS_VALIDOS = {"Funcional", "No Funcional", "Dominio"}
PRIORIDADES_VALIDAS = {"Alta", "Media", "Baja"}

class Requisito(BaseModel):
    id: str = Field(description="Ej: RF-01, RNF-01, RD-01")
    tipo: str = Field(description="Funcional | No Funcional | Dominio")
    descripcion: str = Field(description="Descripcion clara y atomica del requisito")
    prioridad: str = Field(description="Alta | Media | Baja")
    criterio_aceptacion: str = Field(description="Condicion verificable que confirma el cumplimiento")

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        normalizado = v.strip().title()
        mapa = {
            "Funcional": "Funcional",
            "No Funcional": "No Funcional",
            "No-Funcional": "No Funcional",
            "Nofuncional": "No Funcional",
            "Dominio": "Dominio",
            "Restriccion De Dominio": "Dominio",
            "Restricción De Dominio": "Dominio",
            "Domain": "Dominio",
            "Functional": "Funcional",
        }
        return mapa.get(normalizado, "Funcional")

    @field_validator("prioridad")
    @classmethod
    def validar_prioridad(cls, v: str) -> str:
        mapa = {
            "alta": "Alta",
            "media": "Media",
            "baja": "Baja",
            "high": "Alta",
            "medium": "Media",
            "low": "Baja",
        }
        return mapa.get(v.strip().lower(), "Media")