from pydantic import BaseModel, Field
from typing import List, Optional

class Requisito(BaseModel):
    id: str = Field(description="Ej: RF-001, RNF-001")
    tipo: str = Field(description="Funcional, No Funcional o Dominio")
    descripcion: str = Field(description="Descripcion clara y atomica")
    prioridad: str = Field(description="Alta, Media, Baja")
    criterio_aceptacion: str = Field(description="Como validar que se cumplio")