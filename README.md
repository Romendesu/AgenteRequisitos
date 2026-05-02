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
9. [Frontend](#9-frontend)
10. [Puesta en marcha](#10-puesta-en-marcha)
11. [Estructura del proyecto](#11-estructura-del-proyecto)

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
- Interfaz responsiva con soporte completo para escritorio y móvil
- Modo claro y modo oscuro

---

## 2. Stack tecnológico

### Backend

| Componente | Tecnología |
|---|---|
| Framework API | FastAPI + Uvicorn |
| Base de datos | TinyDB (NoSQL embebida, sin servidor) |
| Autenticación | JWT (PyJWT) + bcrypt |
| Orquestación LLM | LangChain + LangChain-Ollama |
| Inferencia local | Ollama |
| Plantillas | Jinja2 |
| Exportación PDF | xhtml2pdf / WeasyPrint (fallback) + markdown2 |
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
| Fuentes | Google Sans Flex, Roboto, Roboto Mono |

---

## 3. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                      │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Login /     │   │  Home (Chat) │   │  Aside / Dock        │ │
│  │  Register    │   │  useChat     │   │  historial proyectos  │ │
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
│    ┌────────────────┼────────────────────┐                      │
│    │                │                    │                      │
│    ▼                ▼                    ▼                      │
│  Extractor      Validador           Priorizador                  │
│  (llama3.1:8b)  (llama3.2)          (determinista)              │
│                                          │                      │
│                                          ▼                      │
│                                       Writer                    │
│                                    (llama3.2 + Jinja2)          │
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

**Archivo:** `backend/src/agents/requisitos.py`

Transforma texto libre en un objeto `Requisito` estructurado.

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.1:8b` vía Ollama |
| Entrada | Texto libre del usuario |
| Salida | `Requisito` (id, tipo, descripción, prioridad, criterio_aceptacion) |

**Flujo de clasificación de dos etapas:**

1. **Pre-clasificador determinista** (`_pre_clasificar`): sistema de puntuación por expresiones regulares ponderadas. Si la puntuación máxima supera el umbral mínimo (6 pts), el tipo queda determinado sin usar el LLM.

2. **Fallback LLM** (`_clasificar_con_llm`): solo se activa para casos ambiguos.

**Señales por tipo (muestra):**

| Tipo | Señal de alta confianza (10 pts) |
|---|---|
| Funcional | `"el sistema debe/podrá [calcular\|enviar\|gestionar…]"` |
| No Funcional | `"\d+ ms"`, `"9X.X %"` de disponibilidad |
| Dominio | `RGPD\|GDPR\|HIPAA\|ISO \d+`, `"conforme a la normativa"` |

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

**Archivo:** `backend/src/agents/priorizador.py`

Asigna categoría MoSCoW a cada requisito mediante scoring determinista.

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

---

### Agente 4 — Writer (`AgenteWriter`)

**Archivo:** `backend/src/agents/writer.py`

Genera el documento SRS formal en tres formatos.

| Propiedad | Detalle |
|---|---|
| Modelo | `llama3.2` (solo para introducción narrativa) |
| Entrada | Lista de requisitos + priorización + stakeholders |
| Salida | `.md`, `.pdf`, `.docx` |

**Estructura del documento generado:**

```
Portada con tabla de metadatos (versión, fecha, generado por, total)
Tabla de Contenidos
1. Introducción
   1.1 Propósito del documento   ← generado por LLM
   1.2 Alcance del sistema       ← generado por LLM
   1.3 Definiciones y acrónimos
2. Descripción General del Sistema ← generada por LLM
3. Interesados del Proyecto
4. Requisitos Funcionales (RF)
5. Requisitos No Funcionales (RNF)
6. Restricciones de Dominio (RD)
7. Clasificación MoSCoW
Anexo — Razonamiento de Clasificación
```

El CSS del PDF está optimizado para `xhtml2pdf` con columnas de etiqueta de ancho fijo y `word-wrap: break-word` para evitar desbordamientos en tablas.

---

## 5. Modelos LLM empleados

Todos los modelos corren localmente mediante **Ollama** — sin API externa, sin coste por token.

| Modelo | Agente | Rol |
|---|---|---|
| `llama3.1:8b` | Extractor | Clasificación y redacción de requisitos |
| `llama3.2` (3B) | Validador | Evaluación de calidad |
| `llama3.2` (3B) | Priorizador | Detección de conflictos (scoring es determinista) |
| `llama3.2` (3B) | Writer | Generación de la introducción narrativa |

---

## 6. Sistema de clasificación de requisitos

| Tipo | ID | Badge | Descripción |
|---|---|---|---|
| Funcional | RF-XX | azul | Acción que el sistema ejecuta |
| No Funcional | RNF-XX | morado | Atributo de calidad medible |
| Restricción de Dominio | RD-XX | ámbar | Regla externa o física que el sistema no puede violar |

### Detección de duplicados

Antes de persistir, se compara la descripción generada con todas las existentes. Si la similitud por intersección de palabras supera el 75 %, el backend devuelve HTTP 409.

---

## 7. Sistema de priorización MoSCoW

La priorización se lanza automáticamente al generar el documento. Los resultados quedan persistidos en TinyDB y en `outputs/{project_id}/priorizacion.json`.

**Palabras clave que elevan el impacto de negocio:**
autenticación, seguridad, cifrado, disponibilidad, uptime, tiempo real, RGPD, kill switch…

**Palabras clave que indican Won't Have:**
futuro, próxima versión, v2, opcional avanzado, nice to have, fuera de alcance…

---

## 8. API REST

Base URL de desarrollo: `http://localhost:8000` (el frontend proxifica `/api/*` → `http://localhost:8000`).

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/register` | Registro de usuario |
| `POST` | `/login` | Login → devuelve JWT |
| `PUT` | `/profile` | Actualizar perfil (username, email, password, avatar) |

### Proyectos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects` | Crear proyecto |
| `GET` | `/projects` | Listar proyectos del usuario autenticado |
| `DELETE` | `/projects/{id}` | Eliminar proyecto y sus datos |

### Requisitos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects/{id}/requisitos` | Procesar y guardar un requisito vía chat |
| `GET` | `/projects/{id}/requisitos` | Listar todos los requisitos |

### Stakeholders

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects/{id}/stakeholders` | Guardar interesados del proyecto |

### Documento

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/projects/{id}/finalizar` | Validar + priorizar + generar documento |
| `GET` | `/projects/{id}/preview` | Vista previa en Markdown |
| `GET` | `/projects/{id}/download/{fmt}` | Descargar: `md`, `pdf` o `docx` |

> Todos los endpoints (excepto `/register` y `/login`) requieren `Authorization: Bearer <token>`.

---

## 9. Frontend

### Flujo de fases del chat

| Fase | Descripción |
|---|---|
| `SETUP` | Formulario de nombre y descripción del proyecto |
| `STAKEHOLDERS` | Captura de interesados y roles |
| `COLLECTING` | Iteración de requisitos mediante chat |
| `FINALIZING` | El sistema valida, prioriza y genera el documento |
| `DONE` | Documento disponible para ver y exportar |

### Layout escritorio

```
┌────────────┬──────────────────────────┬──────────────┐
│            │                          │              │
│   Aside    │     Área de chat         │ Requirements │
│  (64-256px)│     (max-w-2xl)          │  Panel(288px)│
│            │                          │              │
│ colapsable │  ProjectSetupForm /      │  colapsable  │
│            │  ChatMessages +          │              │
│            │  PromptLabel             │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Aside (sidebar):**
- Colapsable entre 64px (iconos) y 256px (texto completo)
- Lista de proyectos expandible con acciones: abrir chat, añadir requisitos, vista previa del documento, eliminar (con confirmación)
- Buscador de proyectos
- Footer con perfil de usuario, configuración y cerrar sesión

**RequirementsPanel:**
- Panel derecho colapsable (288px)
- Lista de requisitos con badges de tipo y categoría MoSCoW
- Grid de contadores MoSCoW (Must / Should / Could / Won't)
- Botones para ver documento y exportar (MD, PDF, DOCX)

### Layout móvil (< 768px)

```
┌─────────────────────────────────┐
│                                 │
│         Área de chat            │
│         (full width)            │
│                                 │
├─────────────────────────────────┤
│ Proyectos │ Chat │ Req │ Config  │  ← Dock
└─────────────────────────────────┘
```

**Dock (barra de navegación inferior):**
- 4 tabs: Proyectos, Chat, Requisitos, Configuración
- Indicador visual de tab activo (línea superior índigo)
- El tab de Requisitos muestra el conteo cuando hay requisitos

**MobileProjectSheet** — bottom sheet con toda la funcionalidad del sidebar:
- Botón nuevo proyecto
- Búsqueda de proyectos
- Filas expandibles con acciones (abrir chat, añadir, vista previa, eliminar)

**MobileRequirementsSheet** — bottom sheet con:
- Lista completa de requisitos con badges
- Grid MoSCoW
- Ver/exportar documento
- Generar/actualizar documento

### Parser de Markdown

`frontend/src/utils/markdown.js` implementa un parser custom (sin dependencias) que convierte el markdown del backend a HTML:

| Feature | Comportamiento |
|---|---|
| Headings | h1 / h2 / h3 |
| Listas | `<li>` consecutivos agrupados en `<ul>` |
| Tabla de contenidos | Lista de links `#anchor` → `<ul class="toc">` con estilo especial |
| Links | `[texto](url)` → `<a href="url">` |
| Tablas | Parser de pipes con thead/tbody |
| Inline | `**bold**`, `*italic*`, `` `code` `` |

### Temas

Modo oscuro y modo claro controlados por `data-theme="light"` en el `<html>`. Los overrides están centralizados en `frontend/src/assets/styles/index.css` y cubren clases `gray-*`, `slate-*` y los estilos de `.doc-preview`.

---

## 10. Puesta en marcha

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
# Desde la raíz del proyecto
pip install -r requirements.txt

cd backend/src
uvicorn main:app --reload --port 8000
```

Swagger disponible en `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación disponible en `http://localhost:5173`.  
El proxy de Vite redirige automáticamente `/api/*` → `http://127.0.0.1:8000`.

### Variables de entorno (opcionales)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `OLLAMA_MODEL` | `llama3.1:8b` | Modelo del agente Extractor |
| `SECRET_KEY` | `moscow-ai-secret-...` | Clave de firma JWT (cambiar en producción) |

---

## 11. Estructura del proyecto

```
AgenteRequisitos/
├── backend/
│   └── src/
│       ├── main.py                  # FastAPI app + GestorProyecto + endpoints
│       ├── auth.py                  # JWT + bcrypt
│       ├── database.py              # TinyDB helpers
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── requisitos.py        # AgenteRequisitos (pre-clasificador + LLM)
│       │   ├── validador.py         # AgenteValidador
│       │   ├── priorizador.py       # AgentePriorizador (scoring determinista)
│       │   └── writer.py            # AgenteWriter (Jinja2 + xhtml2pdf + python-docx)
│       ├── data/                    # TinyDB — db.json
│       └── outputs/                 # Documentos generados por proyecto
│           └── {project_id}/
│               ├── priorizacion.json
│               └── documento_requisitos/
│                   ├── documento_requisitos.md
│                   ├── documento_requisitos.pdf
│                   └── documento_requisitos.docx
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── App.jsx
│       │   └── router/AppRouter.jsx
│       ├── assets/
│       │   ├── images/
│       │   │   └── logo_moscowai.jpeg
│       │   └── styles/
│       │       └── index.css        # Estilos globales, temas oscuro/claro
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Aside.jsx                    # Sidebar desktop colapsable
│       │   │   ├── Dock.jsx                     # Barra de navegación móvil
│       │   │   ├── RequirementsPanel.jsx         # Panel de requisitos desktop
│       │   │   ├── MobileProjectSheet.jsx        # Sheet de proyectos (móvil)
│       │   │   └── MobileRequirementsSheet.jsx   # Sheet de requisitos (móvil)
│       │   └── ui/
│       │       ├── ChatMessage.jsx              # Tarjetas RF/RNF/RD + documento
│       │       ├── PromptLabel.jsx              # Input del chat
│       │       └── Button.jsx
│       ├── hooks/
│       │   ├── useChat.js           # Máquina de estados del flujo conversacional
│       │   ├── useAside.js          # Estado del sidebar
│       │   ├── useAuth.js           # Login / logout / token
│       │   └── matchMedia.jsx       # useIsMobile — breakpoint 768px
│       ├── pages/
│       │   ├── Home.jsx             # Layout principal — orquesta sidebar, chat y panels
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Settings.jsx         # Configuración: perfil, tema oscuro/claro
│       ├── services/
│       │   └── api.js               # Cliente REST con auto-inject de Bearer
│       └── utils/
│           └── markdown.js          # Parser markdown → HTML (custom, sin dependencias)
├── requirements.txt
└── README.md
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
