# 🤖 Sistema Multi-Agente para Ingeniería de Requisitos

> **Asignatura:** Ingeniería de Requisitos  
> **Enfoque:** Arquitectura de Software · Agentes Autónomos · LLMs  
> **Stack:** LangGraph · CrewAI · GPT-4o · Llama 3.1 · Mistral 7B

---

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura de Agentes](#2-arquitectura-de-agentes)
3. [Protocolo de Comunicación](#3-protocolo-de-comunicación)
4. [Flujo de Trabajo (Workflow)](#4-flujo-de-trabajo-workflow)
5. [Justificación de Modelos](#5-justificación-de-modelos)
6. [Análisis MoSCoW del Sistema](#6-análisis-moscow-del-sistema)
7. [Ejemplo de Salida — Anexo de Razonamiento](#7-ejemplo-de-salida--anexo-de-razonamiento)
8. [Diagrama de Arquitectura](#8-diagrama-de-arquitectura)

---

## 1. Visión General

El sistema automatiza el proceso completo de **Ingeniería de Requisitos** mediante una arquitectura de **5 agentes especializados** que colaboran en pipeline. Cada agente tiene un rol único, herramientas propias y produce artefactos tipados que alimentan al siguiente nodo del grafo.

### Objetivo del Sistema

```
Texto libre del usuario
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│  Intake → Classifier → Prioritizer → Writer → QA Agent   │
└───────────────────────────────────────────────────────────┘
        │
        ▼
Documento formal (RF / RNF / MoSCoW / Anexo)
```

### Principios de Diseño

- **Separación de responsabilidades:** cada agente hace exactamente una cosa.
- **Trazabilidad total:** cada decisión queda registrada con `trace_id`.
- **Feedback loop:** el QA Agent puede redirigir el flujo a cualquier nodo anterior.
- **Stateful pipeline:** el estado evoluciona de forma acumulativa a través del grafo (Blackboard Pattern).

---

## 2. Arquitectura de Agentes

### Agente 01 — Intake Agent 🎙️

**Rol:** Extracción y normalización de necesidades del usuario.

| Propiedad | Detalle |
|-----------|---------|
| **Entrada** | Texto libre (entrevistas, historias de usuario, descripciones) |
| **Salida** | `lista_necesidades.json`, `ambiguity_flags[]`, `entity_map{}` |
| **Modelo** | GPT-4o / Claude 3.5 Sonnet |

**Herramientas:**
- `spaCy NLP Pipeline` — POS tagging, NER, dependencias sintácticas
- `Regex patterns` — detección de patrones de requisitos ("el sistema debe…")
- `Vector similarity (RAG)` — comparación con proyectos históricos
- `Tokenizer + Chunker` — segmentación de documentos largos

**Responsabilidades:**
- Parsear texto libre de entrevistas o historias de usuario
- Extraer actores, acciones y restricciones implícitas
- Normalizar al esquema `RequirementCandidate`
- Detectar ambigüedades y generar `ambiguity_flags`

---

### Agente 02 — Classifier Agent 🔍

**Rol:** Categorización de necesidades en RF / RNF / Restricciones de Dominio.

| Propiedad | Detalle |
|-----------|---------|
| **Entrada** | `lista_necesidades.json` |
| **Salida** | `requisitos_clasificados.json`, `classification_reasoning[]`, `confidence_scores{}` |
| **Modelo** | Llama 3.1 70B (fine-tuned sobre datasets de requisitos) |

**Herramientas:**
- `LLM fine-tuned` — clasificador especializado en taxonomía de requisitos
- `Chain-of-Thought prompting` — razonamiento explícito por cada decisión
- `Taxonomía ISO 25010` — referencia de atributos de calidad (RNF)
- `Pydantic validator` — validación del esquema de salida

**Heurísticas de Clasificación:**

| Heurística | Descripción | Resultado |
|------------|-------------|-----------|
| **Verb-Action Test** | ¿Describe una acción del sistema? | → RF |
| **Quality Attribute Taxonomy** | ¿Menciona rendimiento, seguridad, disponibilidad? | → RNF |
| **Measurability Check** | ¿Tiene métrica cuantificable? | → RNF bien formado |
| **Domain Constraint Check** | ¿Impuesto por regulación/tecnología externa? | → Restricción de Dominio |

---

### Agente 03 — Prioritizer Agent ⚖️

**Rol:** Análisis MoSCoW detallado con scoring cuantificado.

| Propiedad | Detalle |
|-----------|---------|
| **Entrada** | `requisitos_clasificados.json` |
| **Salida** | `requisitos_priorizados.json`, `moscow_labels{}`, `conflict_report[]`, `priority_scores{}` |
| **Modelo** | Mistral 7B Instruct |

**Herramientas:**
- `MoSCoW scoring matrix` — evaluación multidimensional
- `Conflict detector` — detección de requisitos contradictorios
- `Impact/Effort estimator` — scoring 1-5 por dimensión

**Dimensiones de Evaluación:**

```
Score final = f(impacto_negocio, riesgo_técnico, esfuerzo_estimado, dependencias)
```

| Dimensión | Escala | Descripción |
|-----------|--------|-------------|
| Impacto en negocio | 1-5 | Valor aportado al usuario/cliente |
| Riesgo técnico | 1-5 | Complejidad de implementación |
| Esfuerzo estimado | 1-5 | Recursos necesarios (tiempo/personas) |
| Dependencias | 1-5 | Número de requisitos que bloquea |

---

### Agente 04 — Writer Agent 📝

**Rol:** Generación del documento formal estructurado.

| Propiedad | Detalle |
|-----------|---------|
| **Entrada** | `requisitos_priorizados.json` |
| **Salida** | `documento_requisitos.md`, `documento_requisitos.pdf`, `documento_requisitos.docx` |
| **Modelo** | GPT-4o / Claude 3.5 Sonnet |

**Herramientas:**
- `Jinja2 Templates` — renderizado de secciones con datos estructurados
- `WeasyPrint` — conversión Markdown → PDF con estilos CSS
- `Pandoc` — conversión Markdown → DOCX

**Estructura del Documento Generado:**

```
documento_requisitos/
├── 1. Introducción
│   ├── 1.1 Propósito del documento
│   ├── 1.2 Alcance del sistema
│   └── 1.3 Definiciones y acrónimos
├── 2. Descripción General
├── 3. Requisitos Funcionales (RF)
├── 4. Requisitos No Funcionales (RNF)
├── 5. Restricciones de Dominio
├── 6. Tabla de Priorización MoSCoW
└── ANEXO B — Razonamiento del Classifier Agent
```

---

### Agente 05 — QA Agent 🛡️

**Rol:** Validación de coherencia y ciclo de retroalimentación.

| Propiedad | Detalle |
|-----------|---------|
| **Entrada** | `documento_requisitos.md` |
| **Salida** | `qa_report.json`, `approval_status: PASS\|FAIL`, `issues[]`, `redirect_to: agent_id\|null` |
| **Modelo** | GPT-4o |

**Herramientas:**
- `Consistency checker rules` — reglas formales de coherencia entre secciones
- `LangSmith evaluator` — trazabilidad y scoring de calidad
- `Feedback router (LangGraph)` — arista condicional de redirección

**Checks de Validación:**

- [ ] Coherencia entre RF y RNF (¿hay RNF sin RF que los sustente?)
- [ ] Completitud del documento (¿todas las secciones presentes?)
- [ ] Requisitos ambiguos (¿frases como "el sistema debería ser rápido"?)
- [ ] Conflictos MoSCoW (¿dos Must Have contradictorios?)
- [ ] Trazabilidad del Anexo (¿todos los requisitos tienen razonamiento?)

---

## 3. Protocolo de Comunicación

### Formato de Mensaje

Todos los agentes se comunican mediante **JSON Schema tipado**:

```json
{
  "agent_id": "classifier-agent",
  "trace_id": "ca-20240315-0042",
  "timestamp": "2024-03-15T14:22:31Z",
  "payload": {
    "requirements": [...],
    "metadata": {...}
  },
  "status": "SUCCESS | PARTIAL | FAILED"
}
```

### Infraestructura de Comunicación

| Componente | Tecnología | Función |
|------------|------------|---------|
| **Orquestador** | LangGraph StateGraph | Gestión del grafo de agentes y estado compartido |
| **Bus de eventos** | Redis Streams | Cola asíncrona con reintentos y dead-letter queue |
| **Estado compartido** | Blackboard Pattern | Estado global que evoluciona a través del grafo |
| **Trazabilidad** | OpenTelemetry | Registro de cada decisión con `trace_id` |
| **Feedback loop** | Edge Condicional LangGraph | Redirección al agente con fallo detectado |

### Contrato entre Nodos (Pydantic)

```python
class RequirementCandidate(BaseModel):
    id: str
    raw_text: str
    extracted_entities: List[str]
    ambiguity_flag: bool
    confidence: float

class ClassifiedRequirement(RequirementCandidate):
    category: Literal["RF", "RNF", "DOMAIN_CONSTRAINT"]
    subcategory: Optional[str]
    reasoning: str
    iso_25010_ref: Optional[str]

class PrioritizedRequirement(ClassifiedRequirement):
    moscow: Literal["MUST", "SHOULD", "COULD", "WONT"]
    impact_score: float
    effort_score: float
    conflicts_with: List[str]
```

---

## 4. Flujo de Trabajo (Workflow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LangGraph StateGraph                    │
│                                                                 │
│  [INPUT]                                                        │
│  texto_libre.txt                                                │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    lista_necesidades.json                      │
│  │ INTAKE      │──────────────────────────►                     │
│  │ AGENT  🎙️  │                                                 │
│  └─────────────┘                                                │
│                                │                                │
│                                ▼                                │
│  ┌─────────────┐    requisitos_clasificados.json                │
│  │ CLASSIFIER  │──────────────────────────────►                 │
│  │ AGENT  🔍  │                                                 │
│  └─────────────┘                                                │
│                                │                                │
│                                ▼                                │
│  ┌─────────────┐    requisitos_priorizados.json                 │
│  │ PRIORITIZER │──────────────────────────────►                 │
│  │ AGENT  ⚖️  │                                                 │
│  └─────────────┘                                                │
│                                │                                │
│                                ▼                                │
│  ┌─────────────┐    documento_requisitos.md                     │
│  │ WRITER      │──────────────────────────────►                 │
│  │ AGENT  📝  │                                                 │
│  └─────────────┘                                                │
│                                │                                │
│                                ▼                                │
│  ┌─────────────┐    ┌──────────────────────┐                   │
│  │ QA          │    │ PASS → OUTPUT FINAL  │                   │
│  │ AGENT  🛡️  │───►│                      │                   │
│  └─────────────┘    │ FAIL → redirect_to:  │                   │
│         ▲           │   agent_id anterior  │                   │
│         └───────────┘                      │                   │
│                     └──────────────────────┘                   │
│                                                                 │
│  [OUTPUT]                                                       │
│  documento_requisitos.pdf / .docx / .md                        │
└─────────────────────────────────────────────────────────────────┘
```

### Paso a Paso Detallado

**Paso 1 — Ingesta (Intake Agent)**
1. El usuario proporciona descripción en lenguaje natural
2. spaCy extrae POS tags, entidades nombradas y dependencias
3. El LLM normaliza e identifica necesidades atómicas
4. Se genera `lista_necesidades.json` con `ambiguity_flags`

**Paso 2 — Clasificación (Classifier Agent)**
1. Recibe cada necesidad cruda del JSON anterior
2. Aplica Chain-of-Thought: analiza verbos, sujetos y atributos de calidad
3. Consulta taxonomía ISO 25010 para RNF
4. Produce clasificación + razonamiento + score de confianza
5. Descompone requisitos compuestos en atómicos (RF + RNF separados)

**Paso 3 — Priorización (Prioritizer Agent)**
1. Evalúa cada requisito en 4 dimensiones (impacto, riesgo, esfuerzo, dependencias)
2. Asigna etiqueta MoSCoW con justificación textual
3. Ejecuta conflict detector: busca Must Have contradictorios
4. Genera `priority_scores{}` y `conflict_report[]`

**Paso 4 — Documentación (Writer Agent)**
1. Carga plantillas Jinja2 por sección del documento
2. LLM genera el texto narrativo de introducción y descripciones
3. Renderiza tablas de RF, RNF y MoSCoW con los datos estructurados
4. Compone el Anexo B con el razonamiento del Classifier Agent
5. Convierte Markdown → PDF (WeasyPrint) y → DOCX (Pandoc)

**Paso 5 — Validación (QA Agent)**
1. Lee el documento generado completo
2. Ejecuta checklist de coherencia (15 reglas formales)
3. Si `PASS`: aprueba el artefacto final
4. Si `FAIL`: genera `issues[]` con `redirect_to: agent_id` y LangGraph redirige el flujo

---

## 5. Justificación de Modelos

### LLMs Base

| Modelo | Agente | Razón de Elección |
|--------|--------|-------------------|
| **GPT-4o** ⭐ | Intake, Writer, QA | Razonamiento largo, generación de texto técnico estructurado, seguimiento de instrucciones complejas |
| **Claude 3.5 Sonnet** ⭐ | Intake, Writer, QA | Alternativa a GPT-4o; superior en generación de documentos técnicos largos |
| **Llama 3.1 70B (fine-tuned)** | Classifier | Open-source fine-tuneable sobre datasets de requisitos. Menor latencia/coste en clasificación repetitiva. Desplegable on-premise |
| **Mistral 7B Instruct** | Prioritizer | Eficiente para scoring estructurado. Con prompt engineering correcto produce JSON consistente a bajo coste |
| **text-embedding-3-large** | Todos (RAG) | Búsqueda semántica de requisitos similares en proyectos históricos |

### Frameworks de Orquestación

| Framework | Rol | Justificación |
|-----------|-----|---------------|
| **LangGraph** ⭐ | Orquestador principal | Soporta ciclos nativos (imprescindible para el QA feedback loop). Control granular del estado. Ideal para pipelines con bucles |
| **CrewAI** | Alternativa de alto nivel | Abstracción más sencilla para prototipos. Define agentes con roles en lenguaje natural. Ideal para demos académicas |
| **LangChain LCEL** | Cadenas internas de agentes | Cada agente usa LCEL internamente: `retriever → prompt → LLM → parser`. Composable y testeable |

### Comparativa LangGraph vs CrewAI

```
                    LangGraph           CrewAI
─────────────────────────────────────────────────
Control del flujo   Alto (grafo)        Medio (secuencial)
Feedback loops      Nativo ✓            Requiere workaround
Curva de aprendizaje Alta               Baja
Ideal para          Producción          Prototipado académico
Estado compartido   StateGraph          Blackboard básico
Debuggabilidad      Alta (LangSmith)    Media
```

### Herramientas por Agente

| Herramienta | Agente | Función |
|-------------|--------|---------|
| `spaCy NLP Pipeline` | Intake | Extracción de entidades antes del LLM. Reduce tokens consumidos |
| `Pydantic + JSONSchema` | Todos | Validación de contratos entre nodos del grafo |
| `Jinja2 Templates` | Writer | Renderizado de secciones del documento con datos estructurados |
| `WeasyPrint / Pandoc` | Writer | Conversión Markdown → PDF / DOCX |
| `LangSmith` | QA + Monitoreo | Trazabilidad completa de llamadas LLM. Evaluación de calidad |
| `Chroma / Pinecone` | Todos (RAG) | Vector store para requisitos históricos. Chroma en dev, Pinecone en prod |
| `Redis Streams` | Orquestador | Bus de eventos asíncrono con reintentos |

---

## 6. Análisis MoSCoW del Sistema

### Must Have — Obligatorio

> Sin estas funcionalidades el sistema no tiene valor mínimo viable.

- Extracción de requisitos desde texto libre (Intake Agent)
- Clasificación automática RF / RNF (Classifier Agent)
- Generación de documento con secciones básicas (Writer Agent)
- Validación de coherencia entre requisitos (QA Agent)

### Should Have — Importante

> Alta prioridad; no bloquean el MVP pero son esenciales a corto plazo.

- Análisis de conflictos entre requisitos (Prioritizer Agent)
- RAG sobre base de conocimiento de proyectos históricos
- Exportación en PDF con formato profesional
- Trazabilidad de decisiones en Anexo B

### Could Have — Deseable

> Si hay tiempo y recursos disponibles en esta iteración.

- Interfaz web para el usuario final
- Soporte multiidioma (inglés, francés, alemán)
- Integración con Jira / Confluence vía API
- Fine-tuning propio del Classifier Agent con datos propios

### Won't Have — Fuera de Alcance

> Descartado para esta versión del sistema.

- Estimación automática de story points
- Generación de casos de prueba a partir de requisitos
- Despliegue en producción cloud (AWS / GCP)
- Interfaz de voz para ingesta de requisitos

---

## 7. Ejemplo de Salida — Anexo de Razonamiento

A continuación se muestra cómo el sistema documenta automáticamente el razonamiento del **Classifier Agent** para un requisito de ejemplo.

---

### ANEXO B — Razonamiento de Clasificación de Requisitos

<!-- Generado automáticamente por el Classifier Agent · trace_id: ca-20240315-0042 -->

#### B.1 Requisito Analizado

```
ID:          REQ-007
Descripción: "El sistema debe permitir que los usuarios registrados inicien sesión
              con su correo electrónico y contraseña, y la sesión debe expirar
              automáticamente tras 30 minutos de inactividad."
```

#### B.2 Decisión de Clasificación

```
Clasificación asignada:  DUAL — RF + RNF
Confianza del modelo:    0.94 / 1.00
```

#### B.3 Descomposición del Requisito

**→ RF-007a** `"Login con email + contraseña"`

```
Razón:    Describe una ACCIÓN FUNCIONAL específica del sistema.
Verbos:   "permitir", "iniciar sesión"
Sujeto:   "usuarios registrados" (actor definido → caso de uso)
Patrón:   IEEE 830: "El sistema SHALL + [verbo] + [objeto]" ✓
```

**→ RNF-007b** `"Expiración de sesión a los 30 min"`

```
Razón:    Atributo de SEGURIDAD (ISO 25010: Security > Confidentiality)
          No describe qué hace el sistema, sino CÓMO debe comportarse.
Métrica:  30 min → cuantificable → testeable con criterio de aceptación
Categoría: RNF · Seguridad > Control de Sesión
```

#### B.4 Heurísticas Aplicadas

| Heurística | Pregunta | Resultado |
|------------|----------|-----------|
| **Verb-Action Test** | ¿Describe una acción que el sistema realiza? | "iniciar sesión" = SÍ → **RF** |
| **Quality Attribute Taxonomy** | ¿Menciona seguridad, rendimiento, disponibilidad? | "expirar" = Seguridad → **RNF** |
| **Measurability Check** | ¿Tiene métrica cuantificable? | "30 minutos" = SÍ → **RNF bien formado** |
| **Domain Constraint Check** | ¿Impuesto por regulación externa? | Definido internamente = NO → **No aplica** |

#### B.5 Prioridad MoSCoW Asignada

```
RF-007a:  MUST HAVE   ← Sin login, el sistema no tiene usuarios
RNF-007b: SHOULD HAVE ← Importante para seguridad; negociable en tiempo
```

```
────────────────────────────────────────────────────────────
Generado: 2024-03-15T14:22:31Z
Modelo:   Llama-3.1-70B-classifier
Versión:  LangGraph v0.2.0
```

---

## 8. Diagrama de Arquitectura

```
                         ┌──────────────────────────┐
                         │   USUARIO / STAKEHOLDER   │
                         │  (texto, entrevistas, HU) │
                         └────────────┬─────────────┘
                                      │ texto libre
                                      ▼
                         ┌────────────────────────┐
                         │     INTAKE AGENT  🎙️   │
                         │  spaCy · GPT-4o · RAG  │
                         └────────────┬───────────┘
                                      │ lista_necesidades.json
                                      ▼
                         ┌────────────────────────┐
                         │   CLASSIFIER AGENT 🔍  │
                         │  Llama 3.1 · ISO 25010 │
                         └────────────┬───────────┘
                                      │ requisitos_clasificados.json
                                      ▼
                         ┌────────────────────────┐
                         │  PRIORITIZER AGENT ⚖️  │
                         │  Mistral 7B · MoSCoW   │
                         └────────────┬───────────┘
                                      │ requisitos_priorizados.json
                                      ▼
                         ┌────────────────────────┐
                         │    WRITER AGENT  📝    │
                         │  GPT-4o · Jinja2 · PDF │
                         └────────────┬───────────┘
                                      │ documento_requisitos.md
                                      ▼
                         ┌────────────────────────┐
              ┌──────────│     QA AGENT  🛡️       │
              │          │  GPT-4o · LangSmith    │
              │          └────────────┬───────────┘
              │                       │
              │          ┌────────────┴────────────┐
              │          │                         │
              │        PASS ✓                   FAIL ✗
              │          │                         │
              │          ▼                         ▼
              │   ┌─────────────┐      ┌─────────────────────┐
              │   │ OUTPUT      │      │  redirect_to:        │
              │   │ FINAL  ✅  │      │  agent_id + issues[] │
              │   └─────────────┘      └──────────┬──────────┘
              │                                   │
              └───────────────────────────────────┘
                         (LangGraph feedback loop)


  INFRAESTRUCTURA:
  ┌─────────────────────────────────────────────────────────┐
  │  LangGraph StateGraph  │  Redis Streams  │  Pinecone    │
  │  OpenTelemetry         │  Pydantic       │  LangSmith   │
  └─────────────────────────────────────────────────────────┘
```

---

## Referencias

- **IEEE Std 830-1998** — Recommended Practice for Software Requirements Specifications
- **ISO/IEC 25010:2011** — Systems and software Quality Requirements and Evaluation
- **LangGraph Documentation** — https://langchain-ai.github.io/langgraph/
- **CrewAI Documentation** — https://docs.crewai.com/
- **Bass, L. et al.** — *Software Architecture in Practice*, 4th Ed. — Quality Attribute Taxonomy
- **MoSCoW Method** — Clegg, D. & Barker, R. (1994) — DSDM Framework

---
