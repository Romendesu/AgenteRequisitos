import json
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import database as db
import auth
from agents import AgenteRequisitos, AgenteValidador, AgentePriorizador, AgenteWriter

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProjectRequest(BaseModel):
    nombre: str = Field(..., min_length=1)
    descripcion: str = Field("", description="Propósito del proyecto")

class RequisitoRequest(BaseModel):
    texto: str = Field(..., min_length=1)


# ─── Gestor de proyecto ───────────────────────────────────────────────────────

class GestorProyecto:
    """Encapsula la lógica de agentes para un proyecto concreto."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.extractor = AgenteRequisitos()
        self.validador = AgenteValidador()
        self.priorizador = AgentePriorizador()
        self.writer = AgenteWriter()
        self.output_dir = Path(f"outputs/{project_id}")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _next_id(self, tipo: str) -> str:
        existing = db.get_requirements(self.project_id)
        prefix = "RNF" if "No Funcional" in tipo else ("RD" if "Dominio" in tipo else "RF")
        count = sum(1 for r in existing if r.get("id", "").startswith(prefix + "-"))
        return f"{prefix}-{count + 1:02d}"

    def _es_duplicado(self, descripcion: str) -> Optional[str]:
        existentes = db.get_requirements(self.project_id)
        desc_norm = descripcion.lower().strip()
        for r in existentes:
            existente_norm = r.get("descripcion", "").lower().strip()
            # Similitud simple: si comparten más del 80% de palabras significativas
            palabras_nueva = set(desc_norm.split())
            palabras_existente = set(existente_norm.split())
            if not palabras_nueva or not palabras_existente:
                continue
            comunes = palabras_nueva & palabras_existente
            similitud = len(comunes) / max(len(palabras_nueva), len(palabras_existente))
            if similitud >= 0.75:
                return r.get("id")
        return None

    def procesar_requisito(self, texto: str) -> Dict[str, Any]:
        req = self.extractor.procesar_texto(texto)

        duplicado_id = self._es_duplicado(req.descripcion)
        if duplicado_id:
            raise ValueError(f"DUPLICADO:{duplicado_id}")

        analisis = self.validador.validar(req.descripcion)

        req_dict = req.model_dump()
        req_dict["id"] = self._next_id(req_dict["tipo"])

        db.save_requirement(self.project_id, req_dict)

        return {"requisito": req_dict, "calidad": analisis.model_dump()}

    def priorizar(self) -> Dict:
        requisitos = db.get_requirements(self.project_id)
        if not requisitos:
            raise ValueError("No hay requisitos para priorizar")

        resultado = self.priorizador.priorizar(requisitos)
        resultado_dict = resultado.model_dump()
        db.save_priorizacion(self.project_id, resultado_dict)

        # Persistir JSON en disco también
        (self.output_dir / "priorizacion.json").write_text(
            json.dumps(resultado_dict, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        return resultado_dict

    def generar_documento(self) -> Dict:
        requisitos = db.get_requirements(self.project_id)
        if not requisitos:
            raise ValueError("No hay requisitos para generar el documento")

        priorizacion = db.get_priorizacion(self.project_id)

        temp = self.output_dir / "temp_requisitos.json"
        temp.write_text(
            json.dumps({"requisitos": requisitos}, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        priorizacion_path = str(self.output_dir / "priorizacion.json") if priorizacion else None
        resultado = self.writer.generar_documento(str(temp), priorizacion_path)
        temp.unlink(missing_ok=True)

        descargar = {
            "md": "/documento/md" if resultado.get("md") else None,
            "pdf": "/documento/pdf" if resultado.get("pdf") else None,
            "docx": "/documento/docx" if resultado.get("docx") else None,
        }
        return {"message": "Documento generado", "descargar": descargar}

    def ruta_documento(self, formato: str) -> Optional[str]:
        candidatos = {
            "md": self.output_dir / "documento_requisitos" / "documento_requisitos.md",
            "pdf": self.output_dir / "documento_requisitos" / "documento_requisitos.pdf",
            "docx": self.output_dir / "documento_requisitos" / "documento_requisitos.docx",
        }
        # Fallback a ruta global del writer (que usa outputs/documento_requisitos/)
        global_candidatos = {
            "md": Path("outputs/documento_requisitos/documento_requisitos.md"),
            "pdf": Path("outputs/documento_requisitos/documento_requisitos.pdf"),
            "docx": Path("outputs/documento_requisitos/documento_requisitos.docx"),
        }
        ruta = candidatos.get(formato)
        if ruta and ruta.exists():
            return str(ruta)
        ruta = global_candidatos.get(formato)
        if ruta and ruta.exists():
            return str(ruta)
        return None

    def preview_documento(self) -> str:
        ruta = self.ruta_documento("md")
        if not ruta:
            raise FileNotFoundError("Documento no generado todavía")
        return Path(ruta).read_text(encoding="utf-8")


# ─── FastAPI ──────────────────────────────────────────────────────────────────

app = FastAPI(title="MoSCoW AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/auth/register", status_code=201, tags=["Auth"])
def register(req: RegisterRequest):
    if not auth.validate_email(req.email):
        raise HTTPException(400, "Email inválido")
    errors = auth.validate_password(req.password)
    if errors:
        raise HTTPException(400, "; ".join(errors))
    if not req.username.strip():
        raise HTTPException(400, "El nombre de usuario no puede estar vacío")
    if db.get_user_by_email(req.email):
        raise HTTPException(409, "Ya existe una cuenta con ese email")

    user = db.create_user(
        email=req.email,
        username=req.username.strip(),
        password_hash=auth.hash_password(req.password),
    )
    return {"id": user["id"], "email": user["email"], "username": user["username"]}


@app.post("/auth/login", tags=["Auth"])
def login(req: LoginRequest):
    user = db.get_user_by_email(req.email)
    if not user or not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Email o contraseña incorrectos")

    token = auth.create_token(user["id"], user["email"], user["username"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "username": user["username"]},
    }


# ─── Proyectos ────────────────────────────────────────────────────────────────

@app.post("/projects", status_code=201, tags=["Proyectos"])
def crear_proyecto(req: ProjectRequest, user=Depends(auth.get_current_user)):
    project = db.create_project(user["id"], req.nombre, req.descripcion)
    return project


@app.get("/projects", tags=["Proyectos"])
def listar_proyectos(user=Depends(auth.get_current_user)):
    return db.get_projects_by_user(user["id"])


@app.delete("/projects/{project_id}", tags=["Proyectos"])
def eliminar_proyecto(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    if not db.delete_project(project_id):
        raise HTTPException(404, "Proyecto no encontrado")
    return {"message": "Proyecto eliminado"}


@app.get("/projects/{project_id}", tags=["Proyectos"])
def obtener_proyecto(project_id: str, user=Depends(auth.get_current_user)):
    project = _verificar_proyecto(project_id, user["id"])
    requisitos = db.get_requirements(project_id)
    priorizacion = db.get_priorizacion(project_id)
    return {**project, "total_requisitos": len(requisitos), "priorizado": priorizacion is not None}


# ─── Requisitos ───────────────────────────────────────────────────────────────

@app.post("/projects/{project_id}/requisitos", status_code=201, tags=["Requisitos"])
def crear_requisito(project_id: str, req: RequisitoRequest, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    try:
        gestor = GestorProyecto(project_id)
        return gestor.procesar_requisito(req.texto)
    except ValueError as e:
        msg = str(e)
        if msg.startswith("DUPLICADO:"):
            dup_id = msg.split(":", 1)[1]
            raise HTTPException(409, f"Este requisito ya existe o es muy similar al requisito {dup_id}")
        raise HTTPException(400, msg)
    except Exception as e:
        raise HTTPException(500, f"Error procesando requisito: {e}")


@app.get("/projects/{project_id}/requisitos", tags=["Requisitos"])
def listar_requisitos(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    requisitos = db.get_requirements(project_id)
    return {"total": len(requisitos), "requisitos": requisitos}


@app.delete("/projects/{project_id}/requisitos/{req_id}", tags=["Requisitos"])
def eliminar_requisito(project_id: str, req_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    if not db.delete_requirement(project_id, req_id):
        raise HTTPException(404, f"Requisito {req_id} no encontrado")
    return {"message": f"Requisito {req_id} eliminado"}


@app.delete("/projects/{project_id}/requisitos", tags=["Requisitos"])
def eliminar_todos(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    n = db.delete_all_requirements(project_id)
    return {"message": f"Se eliminaron {n} requisitos"}


# ─── Priorización ─────────────────────────────────────────────────────────────

@app.post("/projects/{project_id}/priorizar", tags=["Priorización"])
def priorizar(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    try:
        gestor = GestorProyecto(project_id)
        return gestor.priorizar()
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Error en priorización: {e}")


@app.get("/projects/{project_id}/priorizacion", tags=["Priorización"])
def obtener_priorizacion(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    resultado = db.get_priorizacion(project_id)
    if not resultado:
        raise HTTPException(404, "No hay priorización disponible")
    return resultado


# ─── Documentación ────────────────────────────────────────────────────────────

@app.post("/projects/{project_id}/documento", tags=["Documentación"])
def generar_documento(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    try:
        gestor = GestorProyecto(project_id)
        return gestor.generar_documento()
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Error generando documento: {e}")


@app.get("/projects/{project_id}/documento/preview", tags=["Documentación"])
def preview_documento(project_id: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    try:
        gestor = GestorProyecto(project_id)
        return {"contenido": gestor.preview_documento()}
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))


@app.get("/projects/{project_id}/documento/{formato}", tags=["Documentación"])
def descargar_documento(project_id: str, formato: str, user=Depends(auth.get_current_user)):
    _verificar_proyecto(project_id, user["id"])
    formato = formato.lower()
    if formato not in ["md", "pdf", "docx"]:
        raise HTTPException(400, f"Formato no soportado: {formato}. Usa: md, pdf, docx")

    gestor = GestorProyecto(project_id)
    ruta = gestor.ruta_documento(formato)

    if not ruta:
        # Intentar generar si no existe
        try:
            gestor.generar_documento()
            ruta = gestor.ruta_documento(formato)
        except Exception as e:
            raise HTTPException(500, f"Error generando documento: {e}")

    if not ruta:
        raise HTTPException(404, f"Documento {formato} no disponible. Genera el documento primero.")

    content_types = {
        "md": "text/markdown",
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    return FileResponse(path=ruta, media_type=content_types[formato], filename=f"requisitos.{formato}")


# ─── Utilidades internas ──────────────────────────────────────────────────────

def _verificar_proyecto(project_id: str, user_id: str) -> dict:
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(404, "Proyecto no encontrado")
    if project["user_id"] != user_id:
        raise HTTPException(403, "No tienes acceso a este proyecto")
    return project


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "online", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
