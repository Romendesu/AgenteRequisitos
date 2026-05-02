import uuid
from datetime import datetime
from pathlib import Path

from tinydb import TinyDB, Query

_DB_DIR = Path("data")
_DB_DIR.mkdir(parents=True, exist_ok=True)

_db = TinyDB(_DB_DIR / "db.json", indent=2, ensure_ascii=False, encoding="utf-8")

_users = _db.table("users")
_projects = _db.table("projects")
_requirements = _db.table("requirements")
_priorizaciones = _db.table("priorizaciones")

Q = Query()


# ─── Usuarios ────────────────────────────────────────────────────────────────

def create_user(email: str, username: str, password_hash: str) -> dict:
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "username": username,
        "password_hash": password_hash,
        "created_at": datetime.now().isoformat(),
    }
    _users.insert(user)
    return user


def get_user_by_email(email: str) -> dict | None:
    results = _users.search(Q.email == email)
    return results[0] if results else None


def get_user_by_id(uid: str) -> dict | None:
    results = _users.search(Q.id == uid)
    return results[0] if results else None


def update_user(user_id: str, updates: dict) -> dict | None:
    _users.update(updates, Q.id == user_id)
    return get_user_by_id(user_id)


# ─── Proyectos ────────────────────────────────────────────────────────────────

def create_project(user_id: str, nombre: str, descripcion: str) -> dict:
    project = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "nombre": nombre,
        "descripcion": descripcion,
        "created_at": datetime.now().isoformat(),
        "status": "active",
    }
    _projects.insert(project)
    return project


def get_projects_by_user(user_id: str) -> list:
    return sorted(
        _projects.search(Q.user_id == user_id),
        key=lambda p: p["created_at"],
        reverse=True,
    )


def get_project(project_id: str) -> dict | None:
    results = _projects.search(Q.id == project_id)
    return results[0] if results else None


def update_project_status(project_id: str, status: str):
    _projects.update({"status": status}, Q.id == project_id)


def delete_project(project_id: str) -> bool:
    removed = _projects.remove(Q.id == project_id)
    _requirements.remove(Q.project_id == project_id)
    _priorizaciones.remove(Q.project_id == project_id)
    return bool(removed)


# ─── Requisitos ───────────────────────────────────────────────────────────────

def save_requirement(project_id: str, req: dict) -> dict:
    record = {**req, "project_id": project_id}
    _requirements.remove((Q.id == req["id"]) & (Q.project_id == project_id))
    _requirements.insert(record)
    return record


def get_requirements(project_id: str) -> list:
    return _requirements.search(Q.project_id == project_id)


def delete_requirement(project_id: str, req_id: str) -> bool:
    removed = _requirements.remove((Q.id == req_id) & (Q.project_id == project_id))
    return bool(removed)


def delete_all_requirements(project_id: str) -> int:
    reqs = get_requirements(project_id)
    _requirements.remove(Q.project_id == project_id)
    return len(reqs)


# ─── Priorizaciones ───────────────────────────────────────────────────────────

def save_priorizacion(project_id: str, resultado: dict):
    _priorizaciones.remove(Q.project_id == project_id)
    _priorizaciones.insert({"project_id": project_id, "resultado": resultado})


def get_priorizacion(project_id: str) -> dict | None:
    results = _priorizaciones.search(Q.project_id == project_id)
    return results[0]["resultado"] if results else None
