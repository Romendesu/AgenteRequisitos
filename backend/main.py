# Punto de entrada para el servidor Backend
from fastapi import FastAPI
from routes import router
import uvicorn 

# Creacion del servidor y ejecuccion
app = FastAPI()
app.include_router(router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)