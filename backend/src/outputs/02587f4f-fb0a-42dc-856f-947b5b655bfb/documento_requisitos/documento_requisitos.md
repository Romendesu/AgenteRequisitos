# Documento de Especificación de Requisitos de Software

**Versión:** 1.0
**Fecha:** 2026-05-01 22:22:28
**Generado por:** MoSCoW AI

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento especifica los requisitos del sistema de software desarrollado.

### 1.2 Alcance del Sistema

El sistema abarca las funcionalidades descritas en los requisitos listados a continuación.

### 1.3 Definiciones y Acrónimos

| Acrónimo | Definición |
|----------|-----------|
| RF | Requisito Funcional |
| RNF | Requisito No Funcional |
| RD | Requisito de Dominio |
| MoSCoW | Must Have / Should Have / Could Have / Won't Have |
| ISO 29148 | Estándar internacional para ingeniería de requisitos |

---

## 2. Descripción General

El sistema ha sido diseñado para satisfacer las necesidades identificadas durante el proceso de ingeniería de requisitos.

---

## 3. Requisitos Funcionales (RF)


### RF-01 — Se deben visualizar los perfumes, segun su precio, fragancia...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-01 |
| **Descripción** | Se deben visualizar los perfumes, segun su precio, fragancia e intensidad |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |


### RF-02 — El sistema permite que los perfumes se puedan organizar por ...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-02 |
| **Descripción** | El sistema permite que los perfumes se puedan organizar por precios, coste y cantidad |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |




---

## 4. Requisitos No Funcionales (RNF)


### RNF-01 — El sistema debe tardar entre 5 segundos a 10 segundos en pro...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-01 |
| **Descripción** | El sistema debe tardar entre 5 segundos a 10 segundos en procesar la compra del usuario |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |


### RNF-02 — Se debe emplear una arquitectura MVC

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-02 |
| **Descripción** | Se debe emplear una arquitectura MVC |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |


### RNF-03 — El sistema debe respetar toda la normativa de los pagos a la...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-03 |
| **Descripción** | El sistema debe respetar toda la normativa de los pagos a la hora de hacer transacciones |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | cumplimiento de las normativas legales |




---

## 5. Restricciones de Dominio (RD)


### RD-01 — El sistema debe respetar el RGPD al ingresar usuarios

| Campo | Detalle |
|-------|---------|
| **ID** | RD-01 |
| **Descripción** | El sistema debe respetar el RGPD al ingresar usuarios |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La aplicación de registro de usuarios debe cumplir con la normativa del Reglamento General de Protección de Datos (RGPD) en cuanto a la recopilación, almacenamiento y tratamiento de datos personales |




---

## 6. Tabla de Priorización MoSCoW

| ID | Descripción | Categoría MoSCoW | Score | Justificación |
|----|-------------|-----------------|-------|---------------|
| RD-01 | El sistema debe respetar el RGPD al ingresar usuar... | Must Have | 4.0 | Must Have — score 4.0/5: alto impacto de negocio (5/5), bajo coste de implementa... |
| RNF-03 | El sistema debe respetar toda la normativa de los ... | Must Have | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para ... |
| RF-02 | El sistema permite que los perfumes se puedan orga... | Should Have | 3.0 | Should Have — score 3.0/5 |
| RF-01 | Se deben visualizar los perfumes, segun su precio,... | Should Have | 2.95 | Should Have — score 2.95/5: bajo coste de implementación (2/5). |
| RNF-01 | El sistema debe tardar entre 5 segundos a 10 segun... | Should Have | 2.85 | Should Have — score 2.85/5 |
| RNF-02 | Se debe emplear una arquitectura MVC | Should Have | 2.85 | Should Have — score 2.85/5 |



---

## ANEXO B — Razonamiento de Clasificación

*Generado automáticamente por el Agente Extractor*


### B.1 — RF-01

**Descripción:** Se deben visualizar los perfumes, segun su precio, fragancia e intensidad

**Tipo:** Funcional
**Prioridad:** Media
**Criterio de Aceptación:** 

---

### B.2 — RF-02

**Descripción:** El sistema permite que los perfumes se puedan organizar por precios, coste y cantidad

**Tipo:** Funcional
**Prioridad:** Media
**Criterio de Aceptación:** 

---

### B.3 — RNF-01

**Descripción:** El sistema debe tardar entre 5 segundos a 10 segundos en procesar la compra del usuario

**Tipo:** No Funcional
**Prioridad:** Media
**Criterio de Aceptación:** 

---

### B.4 — RNF-02

**Descripción:** Se debe emplear una arquitectura MVC

**Tipo:** No Funcional
**Prioridad:** Media
**Criterio de Aceptación:** 

---

### B.5 — RD-01

**Descripción:** El sistema debe respetar el RGPD al ingresar usuarios

**Tipo:** Dominio
**Prioridad:** Alta
**Criterio de Aceptación:** La aplicación de registro de usuarios debe cumplir con la normativa del Reglamento General de Protección de Datos (RGPD) en cuanto a la recopilación, almacenamiento y tratamiento de datos personales

---

### B.6 — RNF-03

**Descripción:** El sistema debe respetar toda la normativa de los pagos a la hora de hacer transacciones

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** cumplimiento de las normativas legales

---


*Documento generado el 2026-05-01 22:22:28 · Sistema Multi-Agente de Ingeniería de Requisitos v1.0*