import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import database as db

SECRET_KEY = os.getenv("SECRET_KEY", "moscow-ai-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

_bearer = HTTPBearer()


# ─── Contraseñas ─────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


# ─── Validaciones ─────────────────────────────────────────────────────────────

def validate_email(email: str) -> bool:
    return bool(re.match(r"^[\w\.\+\-]+@[\w\-]+\.\w{2,}$", email))


def validate_password(password: str) -> list[str]:
    errors = []
    if len(password) < 8:
        errors.append("Mínimo 8 caracteres")
    if not any(c.isupper() for c in password):
        errors.append("Al menos una letra mayúscula")
    if not any(c.isdigit() for c in password):
        errors.append("Al menos un número")
    return errors


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_token(user_id: str, email: str, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "email": email, "username": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ─── Dependencia FastAPI ───────────────────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")

    user = db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado")
    return user


_bearer_optional = HTTPBearer(auto_error=False)


def get_download_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_optional),
    token: Optional[str] = Query(None),
) -> dict:
    """Auth flexible para descargas: acepta header Authorization o ?token= en query."""
    raw = credentials.credentials if credentials else token
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    try:
        payload = decode_token(raw)
        user = db.get_user_by_id(payload["sub"])
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
