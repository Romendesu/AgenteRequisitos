# Archivo de rutas de FastAPI
# Se emplea principalmente para comunicar los agentes

from fastapi import APIRouter

router = APIRouter()

@router.get("/welcome")
def get_users():
    return {"data": "Bienvenido a la API del agente de consultas."}