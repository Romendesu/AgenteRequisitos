# MoSCoW AI — Sistema Multi-Agente de Ingeniería de Requisitos

> Herramienta web que automatiza la extracción, clasificación, priorización y documentación de requisitos de software mediante una arquitectura de agentes LLM locales.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Pipeline multi-agente](#4-pipeline-multi-agente)
5. [Modelos LLM empleados](#5-modelos-llm-empleados)
6. [Sistema de clasificación de requisitos](#6-sistema-de-clasificación-de-requisitos)
7. [Sistema de priorización MoSCoW](#7-sistema-de-priorización-moscow)
8. [API REST](#8-api-rest)
9. [Puesta en marcha](#9-puesta-en-marcha)

---

## 1. Visión general

MoSCoW AI convierte texto libre del usuario en un documento formal de especificación de requisitos de software (SRS). El proceso es completamente conversacional: el usuario describe requisitos en lenguaje natural y el sistema los clasifica, valida, prioriza y exporta en Markdown, PDF y DOCX.

```
Texto libre del usuario
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Extractor → Validador → Priorizador → Writer        │
└─────────────────────────────────────────────────────┘
        │
        ▼
Documento SRS (RF / RNF / RD · MoSCoW · Anexo)
```

### Funcionalidades principales

- Chat conversacional para captura de requisitos por proyecto
- Clasificación automática: **RF** (Funcional), **RNF** (No Funcional), **RD** (Restricción de Dominio)
- Detección de requisitos duplicados (similitud de palabras ≥ 75 %)
- Priorización MoSCoW con scoring determinista multidimensional
- Detección de conflictos entre requisitos (vía LLM)
- Generación de documento SRS en **Markdown**, **PDF** y **DOCX**
- Historial de proyectos con vista previa del documento
- Autenticación JWT con registro y login

---

## 2. Stack tecnológico

### Backend

| Componente | Tecnología |
|---|---|
| Framework API | FastAPI 0.115 |
| Base de datos | TinyDB (NoSQL embebida, sin servidor) |
| Autenticación | JWT (PyJWT) + bcrypt |
| Orquestación LLM | LangChain + LangChain-Ollama |
| Inferencia local | Ollama |
| Plantillas | Jinja2 |
| Exportación PDF | WeasyPrint + markdown2 |
| Exportación DOCX | python-docx |
| Validación de datos | Pydantic v2 |

### Frontend

| Componente | Tecnología |
|---|---|
| Framework UI | React 19 |
| Bundler | Vite |
| Estilos | Tailwind CSS + DaisyUI |
| Routing | React Router v7 |
| HTTP client | Fetch API nativo |

---

## 3. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                      │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Login /     │   │  Home (Chat) │   │  Aside (historial)   │ │
│  │  Register    │   │  useChat     │   │  ProjectRow          │ │
│  └──────────────┘   └──────┬───────┘   └──────────────────────┘ │
│                            │ fetch + Bearer JWT                  │
└────────────────────────────┼────────────────────────────────────┘
                             │ /api/...
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   GestorProyecto                           │ │
│  │   procesar_requisito() → priorizar() → generar_documento() │ │
│  └──────────────────┬────────────────────────────────────────┘ │
│                     │                                            │
│    ┌────────────────┼───────────────────────────┐               │
│    │                │                           │               │
│    ▼                ▼                           ▼               │
│  Extractor      Validador                   Priorizador          │
│  (llama3.1:8b)  (llama3.2)                  (determinista)      │
│                                                │                 │
│                                                ▼                 │
│                                            Writer                │
│                                         (llama3.2 + Jinja2)    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              TinyDB  (db.json)                           │   │
│  │   users · projects · requirements · priorizaciones       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                    outputs/{project_id}/
                    ├── documento_requisitos/
                    │   ├── documento_requisitos.md
                    │   ├── documento_requisitos.pdf
                    │   └── documento_requisitos.docx
                    └── priorizacion.json
```

---

## 4. Pipeline multi-agente

### Agente 1 — Extractor (`AgenteRequisitos`)

**Archivo:** `backend/src/agents/extractor.py`

Transforma texto libre en un objeto `Requisito` estructurado.

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.1:8b` vía Ollama |
| Entrada | Texto libre del usuario |
| Salida | `Requisito` (id, tipo, descripción, prioridad, criterio_aceptacion) |

**Flujo de clasificación de dos etapas:**

1. **Pre-clasificador determinista** (`_pre_clasificar`): sistema de puntuación por expresiones regulares ponderadas. Cada tipo (Funcional, No Funcional, Dominio) acumula puntos según señales lingüísticas. Si la puntuación máxima supera el umbral mínimo (6 pts), el tipo queda determinado sin usar el LLM.

2. **Fallback LLM** (`_clasificar_con_llm`): solo se activa para casos ambiguos. El LLM recibe un prompt corto que le obliga a elegir entre los 3 tipos, con sesgo explícito hacia Funcional para evitar sobreclasificación en Dominio.

**Señales por tipo (muestra):**

| Tipo | Señal de alta confianza (10 pts) |
|---|---|
| Funcional | `"el sistema debe/podrá [calcular\|enviar\|gestionar…]"` |
| Funcional | `"permitirá al usuario/operador [acción]"` |
| No Funcional | `"\d+ ms"`, `"9X.X %"` de disponibilidad |
| No Funcional | `"\d+ usuarios? concurrentes"` |
| Dominio | Nombre de ley: `RGPD\|GDPR\|HIPAA\|ISO \d+` |
| Dominio | `"conforme a/según la normativa/reglamento"` |
| Dominio | `"nunca puede/no puede modificarse una vez"` |
| Dominio | `"ningún [actor] puede/podrá"` |

Si el tipo es conocido, el LLM solo redacta la descripción técnica y el criterio de aceptación (tarea mucho más fiable que clasificar).

---

### Agente 2 — Validador (`AgenteValidador`)

**Archivo:** `backend/src/agents/validador.py`

Evalúa la calidad del requisito recién extraído.

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.2` vía Ollama |
| Entrada | Descripción del requisito |
| Salida | Puntuación 0-10 + observaciones de calidad |

Criterios evaluados: claridad, verificabilidad, atomicidad, trazabilidad.

---

### Agente 3 — Priorizador (`AgentePriorizador`)

**Archivo:** `backend/src/agents/prioritizer.py`

Asigna categoría MoSCoW a cada requisito mediante scoring determinista (sin LLM para las dimensiones, evitando la tendencia del LLM a devolver siempre valores centrales).

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.2` (solo para detección de conflictos) |
| Entrada | Lista de requisitos del proyecto |
| Salida | `PriorizacionResultado` con scores, labels MoSCoW y reporte de conflictos |

**Scoring multidimensional:**

```
score = impacto_negocio × 0.40
      + riesgo_tecnico  × 0.25
      + (6 − esfuerzo)  × 0.20   ← invertido: menos esfuerzo = más score
      + dependencias    × 0.15
```

**Umbrales MoSCoW:**

| Score | Categoría |
|---|---|
| ≥ 3.5 | Must Have |
| ≥ 2.5 | Should Have |
| ≥ 1.5 | Could Have |
| < 1.5 | Won't Have |

**Dimensiones evaluadas de forma determinista:**
- `impacto_negocio`: derivado del campo `prioridad` (Alta → 5, Media → 3, Baja → 1) más bonificación por palabras clave críticas (`autenticación`, `seguridad`, `disponibilidad`…)
- `riesgo_tecnico`: detectado por keywords de complejidad (`algoritmo genético`, `backtracking`, `cifrado`…)
- `esfuerzo_estimado`: por tipo de requisito y complejidad léxica
- `dependencias`: requisitos "core" (motor, autenticación, modelo de datos) bloquean más

---

### Agente 4 — Writer (`AgenteWriter`)

**Archivo:** `backend/src/agents/writer.py`

Genera el documento SRS formal.

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.2` (solo para la introducción narrativa) |
| Entrada | Lista de requisitos + priorización |
| Salida | `.md`, `.pdf`, `.docx` en `outputs/{project_id}/documento_requisitos/` |

**Estructura del documento generado:**

```
1. Introducción
   1.1 Propósito del documento   ← generado por LLM
   1.2 Alcance del sistema       ← generado por LLM
   1.3 Definiciones y acrónimos
2. Descripción general           ← generada por LLM
3. Requisitos Funcionales (RF)
4. Requisitos No Funcionales (RNF)
5. Restricciones de Dominio (RD)
6. Tabla de priorización MoSCoW
ANEXO B — Razonamiento de clasificación
```

El cuerpo de las secciones 3-6 y el anexo se renderizan con **Jinja2** usando los datos estructurados; solo la introducción es generada libremente por el LLM.

---

## 5. Modelos LLM empleados

Todos los modelos corren localmente mediante **Ollama** — sin API externa, sin coste por token.

| Modelo | Agente | Rol |
|---|---|---|
| `llama3.1:8b` | Extractor | Clasificación y redacción de requisitos. El modelo de 8B sigue instrucciones JSON mucho mejor que el 3B. Configurable con `OLLAMA_MODEL`. |
| `llama3.2` (3B) | Validador | Evaluación de calidad. Tarea más simple, el 3B es suficiente y más rápido. |
| `llama3.2` (3B) | Priorizador | Solo para detección de conflictos (no-crítico). El scoring es determinista. |
| `llama3.2` (3B) | Writer | Generación de la introducción narrativa del documento. |

**Variable de entorno:**
```bash
OLLAMA_MODEL=llama3.1:8b   # modelo del extractor (por defecto)
```

---

## 6. Sistema de clasificación de requisitos

### Tipos de requisitos

| Tipo | ID | Badge | Descripción |
|---|---|---|---|
| Funcional | RF-XX | `RF · Funcional` (azul) | Acción que el sistema ejecuta: el sistema debe calcular / enviar / gestionar… |
| No Funcional | RNF-XX | `RNF · No Funcional` (morado) | Atributo de calidad medible: latencia, disponibilidad %, usuarios concurrentes… |
| Restricción de Dominio | RD-XX | `RD · Restricción de Dominio` (ámbar) | Regla externa o física que el sistema no puede violar: leyes, límites físicos, reglas institucionales… |

### Cómo se asigna el ID

El ID se genera incrementalmente por tipo dentro de cada proyecto:

```python
prefix = "RNF" if "No Funcional" in tipo else ("RD" if "Dominio" in tipo else "RF")
count  = # requisitos existentes del mismo prefijo en el proyecto
id     = f"{prefix}-{count + 1:02d}"   # → RF-01, RF-02, RNF-01…
```

### Detección de duplicados

Antes de persistir, se compara la descripción generada con todas las existentes en el proyecto. Si la similitud por intersección de palabras supera el 75 %, el backend devuelve HTTP 409 y el frontend muestra un aviso sin guardar el requisito.

---

## 7. Sistema de priorización MoSCoW

La priorización se lanza automáticamente al generar el documento (o manualmente vía API). Los resultados quedan persistidos en TinyDB y en `outputs/{project_id}/priorizacion.json`.

**Palabras clave que elevan el impacto de negocio:**
autenticación, seguridad, cifrado, RGPD, disponibilidad, uptime, tiempo real, motor de generación, gestión de usuarios, kill switch, obligatorio, imprescindible…

**Palabras clave que indican Won't Have:**
futuro, próxima versión, v2, no prioritario, opcional avanzado, nice to have, descartado, fuera de alcance…

---

## 8. API REST

Base URL: `http://localhost:8000/api`

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login → devuelve JWT |

### Proyectos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects` | Crear proyecto |
| `GET` | `/projects` | Listar proyectos del usuario |
| `GET` | `/projects/{id}` | Detalle del proyecto |
| `DELETE` | `/projects/{id}` | Eliminar proyecto y sus datos |

### Requisitos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects/{id}/requisitos` | Procesar y guardar un requisito |
| `GET` | `/projects/{id}/requisitos` | Listar todos los requisitos |
| `DELETE` | `/projects/{id}/requisitos/{req_id}` | Eliminar un requisito |

### Priorización y documento

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects/{id}/priorizar` | Ejecutar priorización MoSCoW |
| `GET` | `/projects/{id}/priorizacion` | Obtener resultado de priorización |
| `POST` | `/projects/{id}/documento` | Generar documento SRS |
| `GET` | `/projects/{id}/documento/preview` | Vista previa en Markdown |
| `GET` | `/projects/{id}/documento/{formato}` | Descargar: `md`, `pdf` o `docx` |

> Todos los endpoints (excepto `/auth/*`) requieren `Authorization: Bearer <token>`. El endpoint de descarga también acepta `?token=<jwt>` como query param.

---

## 9. Puesta en marcha

### Requisitos previos

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) instalado y en ejecución

### 1. Descargar modelos Ollama

```bash
ollama pull llama3.1:8b
ollama pull llama3.2
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cd src
uvicorn main:app --reload --port 8000
```

El backend queda disponible en `http://localhost:8000`.  
La documentación Swagger está en `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### Variables de entorno (opcionales)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `OLLAMA_MODEL` | `llama3.1:8b` | Modelo del agente Extractor |
| `SECRET_KEY` | `moscow-ai-secret-...` | Clave de firma JWT (cambiar en producción) |

---

## Estructura del proyecto

```
AgenteRequisitos/
├── backend/
│   └── src/
│       ├── main.py              # FastAPI + GestorProyecto
│       ├── auth.py              # JWT + bcrypt
│       ├── database.py          # TinyDB helpers
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── extractor.py     # AgenteRequisitos (pre-clasificador + LLM)
│       │   ├── validador.py     # AgenteValidador
│       │   ├── prioritizer.py   # AgentePriorizador (scoring determinista)
│       │   └── writer.py        # AgenteWriter (Jinja2 + WeasyPrint + python-docx)
│       └── utils/
│           └── schemas.py       # Pydantic models
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx         # Página principal (chat)
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Aside.jsx    # Sidebar con historial de proyectos
│       │   │   └── Button.jsx
│       │   └── ui/
│       │       ├── ChatMessage.jsx   # Tarjetas RF/RNF/RD + documento
│       │       └── PromptLabel.jsx   # Input de chat
│       ├── hooks/
│       │   ├── useChat.js       # Lógica de conversación y estado
│       │   └── useAuth.js       # Login/logout/token
│       └── services/
│           └── api.js           # Cliente HTTP con auto-inject de Bearer
└── outputs/                     # Documentos generados (por proyecto)
    └── {project_id}/
        ├── priorizacion.json
        └── documento_requisitos/
            ├── documento_requisitos.md
            ├── documento_requisitos.pdf
            └── documento_requisitos.docx
```

---

## Referencias

- **IEEE Std 830-1998** — Recommended Practice for Software Requirements Specifications
- **ISO/IEC 25010:2011** — Systems and software Quality Requirements and Evaluation
- **MoSCoW Method** — Clegg, D. & Barker, R. (1994) — DSDM Framework
- **LangChain** — https://python.langchain.com/
- **Ollama** — https://ollama.com/
- **FastAPI** — https://fastapi.tiangolo.com/
- **TinyDB** — https://tinydb.readthedocs.io/
