# Documento de Especificación de Requisitos de Software

**Versión:** 1.0
**Fecha:** 2026-05-01 17:22:13
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


### RF-01 — El sistema debe calcular la ruta de vuelo más corta evitando...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-01 |
| **Descripción** | El sistema debe calcular la ruta de vuelo más corta evitando zonas de exclusión aérea (aeropuertos, zonas militares) mediante un algoritmo de planificación de rutas que considere las coordenadas geográficas de los aeropuertos y zonas militares. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La ruta calculada debe ser la más corta en términos de distancia y tiempo, y no intersectar con ninguna zona de exclusión aérea. |


### RF-02 — El sistema debe permitir al operador humano tomar el control...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-02 |
| **Descripción** | El sistema debe permitir al operador humano tomar el control remoto del dron en caso de emergencia mediante un 'Kill Switch' digital. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La funcionalidad de 'Kill Switch' se activa correctamente y permite al operador humano recuperar el control del dron en menos de 5 segundos desde la activación. |


### RF-03 — El sistema debe enviar una notificación push al cliente cuan...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-03 |
| **Descripción** | El sistema debe enviar una notificación push al cliente cuando el dron se encuentre a menos de 100 metros del Smart-Pad de destino. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La aplicación móvil del cliente recibe la notificación push con un contenido que incluya la distancia exacta entre el dron y el Smart-Pad de destino, siendo menor a 100 metros. |


### RF-04 — El sistema debe reprogramar automáticamente la entrega si lo...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-04 |
| **Descripción** | El sistema debe reprogramar automáticamente la entrega si los sensores del dron detectan obstáculos inesperados en la zona de aterrizaje. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | Los sensores del dron deben detectar al menos un obstáculo inesperado en la zona de aterrizaje y el sistema debe reprogramar la entrega dentro de 5 segundos. |


### RF-05 — El sistema debe bloquear automáticamente todos los despegues...

| Campo | Detalle |
|-------|---------|
| **ID** | RF-05 |
| **Descripción** | El sistema debe bloquear automáticamente todos los despegues si la velocidad del viento detectada por la estación meteorológica supera los 40 km/h. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La velocidad del viento detectada por la estación meteorológica debe ser mayor o igual a 40 km/h para que el sistema bloquee todos los despegues. |




---

## 4. Requisitos No Funcionales (RNF)


### RNF-01 — El sistema debe mantener un uptime del 99,99% para evitar dr...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-01 |
| **Descripción** | El sistema debe mantener un uptime del 99,99% para evitar drones varados en el aire. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | El sistema no puede tener más de 0,01% de tiempo de inactividad durante cualquier período de 30 días consecutivos. |


### RNF-02 — El sistema debe garantizar una comunicación entre el centro ...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-02 |
| **Descripción** | El sistema debe garantizar una comunicación entre el centro de control y el dron con un tiempo de respuesta inferior a 50ms. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La medición del tiempo de respuesta de la comunicación entre el centro de control y el dron debe ser menor o igual a 50ms en al menos el 99% de las operaciones. |


### RNF-03 — El sistema debe verificar la firma digital de cada comando e...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-03 |
| **Descripción** | El sistema debe verificar la firma digital de cada comando enviado al dron antes de su ejecución. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La aplicación debe generar un error y no procesar el comando si la firma digital no es válida según los parámetros de seguridad configurados. |


### RNF-04 — El backend debe ser capaz de coordinar hasta 1,000 drones si...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-04 |
| **Descripción** | El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | número de drones coordinados correctamente |


### RNF-05 — El sistema no permitirá el despacho de pedidos que superen l...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-05 |
| **Descripción** | El sistema no permitirá el despacho de pedidos que superen los 5kg, excediendo la capacidad de sustentación de los motores actuales. |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |




---

## 5. Restricciones de Dominio (RD)


### RD-01 — El sistema debe evitar que los drones vuelen a una altura su...

| Campo | Detalle |
|-------|---------|
| **ID** | RD-01 |
| **Descripción** | El sistema debe evitar que los drones vuelen a una altura superior a 120 metros (400 pies) para cumplir con la normativa de aviación civil local. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La altitud máxima permitida para el vuelo de los drones es inferior o igual a 120 metros (400 pies). |


### RD-02 — El sistema debe rechazar cualquier ruta que comprometa la au...

| Campo | Detalle |
|-------|---------|
| **ID** | RD-02 |
| **Descripción** | El sistema debe rechazar cualquier ruta que comprometa la autonomía de energía del dron. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La batería del dron debe tener al menos un 20% de reserva para el aterrizaje de emergencia después de calcular el consumo estimado de la ruta. |




---

## 6. Tabla de Priorización MoSCoW

| ID | Descripción | Categoría MoSCoW | Score | Justificación |
|----|-------------|-----------------|-------|---------------|
| RF-02 | El sistema debe permitir al operador humano tomar ... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RF-03 | El sistema debe enviar una notificación push al cl... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RF-04 | El sistema debe reprogramar automáticamente la ent... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RNF-01 | El sistema debe mantener un uptime del 99,99% para... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RNF-02 | El sistema debe garantizar una comunicación entre ... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RNF-03 | El sistema debe verificar la firma digital de cada... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RNF-04 | El backend debe ser capaz de coordinar hasta 1,000... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RF-05 | El sistema debe bloquear automáticamente todos los... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RD-02 | El sistema debe rechazar cualquier ruta que compro... | Should Have | 3.3 | Prioridad Should Have con score 3.3/5 debido a: alto impacto de negocio (4/5), b... |
| RF-01 | El sistema debe calcular la ruta de vuelo más cort... | Should Have | 3.05 | Prioridad Should Have con score 3.05/5 debido a: alto impacto de negocio (4/5), ... |
| RNF-05 | El sistema no permitirá el despacho de pedidos que... | Could Have | 2.25 | Prioridad Could Have con score 2.25/5 debido a: alto esfuerzo requerido (4/5) |
| RD-01 | El sistema debe evitar que los drones vuelen a una... | Could Have | 2.25 | Prioridad Could Have con score 2.25/5 debido a: alto esfuerzo requerido (4/5) |



---

## ANEXO B — Razonamiento de Clasificación

*Generado automáticamente por el Agente Extractor*


### B.1 — RF-01

**Descripción:** El sistema debe calcular la ruta de vuelo más corta evitando zonas de exclusión aérea (aeropuertos, zonas militares) mediante un algoritmo de planificación de rutas que considere las coordenadas geográficas de los aeropuertos y zonas militares.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La ruta calculada debe ser la más corta en términos de distancia y tiempo, y no intersectar con ninguna zona de exclusión aérea.

---

### B.2 — RF-02

**Descripción:** El sistema debe permitir al operador humano tomar el control remoto del dron en caso de emergencia mediante un 'Kill Switch' digital.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La funcionalidad de 'Kill Switch' se activa correctamente y permite al operador humano recuperar el control del dron en menos de 5 segundos desde la activación.

---

### B.3 — RF-03

**Descripción:** El sistema debe enviar una notificación push al cliente cuando el dron se encuentre a menos de 100 metros del Smart-Pad de destino.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La aplicación móvil del cliente recibe la notificación push con un contenido que incluya la distancia exacta entre el dron y el Smart-Pad de destino, siendo menor a 100 metros.

---

### B.4 — RF-04

**Descripción:** El sistema debe reprogramar automáticamente la entrega si los sensores del dron detectan obstáculos inesperados en la zona de aterrizaje.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** Los sensores del dron deben detectar al menos un obstáculo inesperado en la zona de aterrizaje y el sistema debe reprogramar la entrega dentro de 5 segundos.

---

### B.5 — RNF-01

**Descripción:** El sistema debe mantener un uptime del 99,99% para evitar drones varados en el aire.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** El sistema no puede tener más de 0,01% de tiempo de inactividad durante cualquier período de 30 días consecutivos.

---

### B.6 — RNF-02

**Descripción:** El sistema debe garantizar una comunicación entre el centro de control y el dron con un tiempo de respuesta inferior a 50ms.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La medición del tiempo de respuesta de la comunicación entre el centro de control y el dron debe ser menor o igual a 50ms en al menos el 99% de las operaciones.

---

### B.7 — RNF-03

**Descripción:** El sistema debe verificar la firma digital de cada comando enviado al dron antes de su ejecución.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La aplicación debe generar un error y no procesar el comando si la firma digital no es válida según los parámetros de seguridad configurados.

---

### B.8 — RNF-04

**Descripción:** El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** número de drones coordinados correctamente

---

### B.9 — RNF-05

**Descripción:** El sistema no permitirá el despacho de pedidos que superen los 5kg, excediendo la capacidad de sustentación de los motores actuales.

**Tipo:** No Funcional
**Prioridad:** Media
**Criterio de Aceptación:** 

---

### B.10 — RD-01

**Descripción:** El sistema debe evitar que los drones vuelen a una altura superior a 120 metros (400 pies) para cumplir con la normativa de aviación civil local.

**Tipo:** Dominio
**Prioridad:** Alta
**Criterio de Aceptación:** La altitud máxima permitida para el vuelo de los drones es inferior o igual a 120 metros (400 pies).

---

### B.11 — RF-05

**Descripción:** El sistema debe bloquear automáticamente todos los despegues si la velocidad del viento detectada por la estación meteorológica supera los 40 km/h.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La velocidad del viento detectada por la estación meteorológica debe ser mayor o igual a 40 km/h para que el sistema bloquee todos los despegues.

---

### B.12 — RD-02

**Descripción:** El sistema debe rechazar cualquier ruta que comprometa la autonomía de energía del dron.

**Tipo:** Dominio
**Prioridad:** Alta
**Criterio de Aceptación:** La batería del dron debe tener al menos un 20% de reserva para el aterrizaje de emergencia después de calcular el consumo estimado de la ruta.

---


*Documento generado el 2026-05-01 17:22:13 · Sistema Multi-Agente de Ingeniería de Requisitos v1.0*