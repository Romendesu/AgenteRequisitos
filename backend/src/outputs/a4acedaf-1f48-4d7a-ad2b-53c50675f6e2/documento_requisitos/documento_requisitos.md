# Documento de Especificación de Requisitos de Software

**Versión:** 1.0
**Fecha:** 2026-05-02 12:45:44
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
| **Criterio de Aceptación** | La ruta calculada debe ser la más corta posible, con una diferencia máxima de 5% en comparación con la ruta óptima determinada por un algoritmo de planificación de rutas conocido (por ejemplo, Dijkstra o A"). |


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
| **Criterio de Aceptación** | La velocidad del viento detectada por la estación meteorológica debe ser superior a 40 km/h para que el sistema bloquee automáticamente todos los despegues. |




---

## 4. Requisitos No Funcionales (RNF)


### RNF-01 — El sistema debe mantener un uptime del 99,99% para evitar dr...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-01 |
| **Descripción** | El sistema debe mantener un uptime del 99,99% para evitar drones varados en el aire. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La disponibilidad del sistema de despacho no debe ser inferior al 99,99% durante cualquier período de observación de 30 días consecutivos. |


### RNF-02 — El sistema debe garantizar una latencia de comunicación entr...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-02 |
| **Descripción** | El sistema debe garantizar una latencia de comunicación entre el centro de control y el dron no superior a 50ms. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La latencia de comunicación entre el centro de control y el dron no supera los 50ms en más del 95% de las transacciones. |


### RNF-03 — El sistema debe verificar la firma digital de todos los coma...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-03 |
| **Descripción** | El sistema debe verificar la firma digital de todos los comandos enviados al dron para evitar el secuestro de la unidad (Anti-spoofing). |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La aplicación debe validar con éxito la firma digital de cada comando enviado al dron utilizando un algoritmo de verificación de firmas digitales seguro y reconocido. |


### RNF-04 — El backend debe ser capaz de coordinar hasta 1,000 drones si...

| Campo | Detalle |
|-------|---------|
| **ID** | RNF-04 |
| **Descripción** | El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | número de drones coordinados correctamente |




---

## 5. Restricciones de Dominio (RD)


### RD-01 — El sistema debe limitar la altura máxima de vuelo a los 120 ...

| Campo | Detalle |
|-------|---------|
| **ID** | RD-01 |
| **Descripción** | El sistema debe limitar la altura máxima de vuelo a los 120 metros (400 pies) para cumplir con la normativa de aviación civil local. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La altura del drone en el momento del vuelo no supera los 120 metros (400 pies), verificada mediante la lectura de sensores de altitud integrados en el sistema. |


### RD-02 — El sistema debe rechazar cualquier ruta que comprometa la re...

| Campo | Detalle |
|-------|---------|
| **ID** | RD-02 |
| **Descripción** | El sistema debe rechazar cualquier ruta que comprometa la reserva de batería del dron para el aterrizaje de emergencia. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La reserva de batería del dron debe ser mayor o igual al 20% después de consumir la energía estimada para cualquier ruta. |




---

## 6. Tabla de Priorización MoSCoW

| ID | Descripción | Categoría MoSCoW | Score | Justificación |
|----|-------------|-----------------|-------|---------------|
| RD-01 | El sistema debe limitar la altura máxima de vuelo ... | Must Have | 4.0 | Must Have — score 4.0/5: alto impacto de negocio (5/5), bajo coste de implementa... |
| RD-02 | El sistema debe rechazar cualquier ruta que compro... | Must Have | 4.0 | Must Have — score 4.0/5: alto impacto de negocio (5/5), bajo coste de implementa... |
| RF-01 | El sistema debe calcular la ruta de vuelo más cort... | Must Have | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para e... |
| RF-02 | El sistema debe permitir al operador humano tomar ... | Must Have | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para e... |
| RF-03 | El sistema debe enviar una notificación push al cl... | Must Have | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para e... |
| RF-04 | El sistema debe reprogramar automáticamente la ent... | Must Have | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para e... |
| RF-05 | El sistema debe bloquear automáticamente todos los... | Must Have | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para e... |
| RNF-03 | El sistema debe verificar la firma digital de todo... | Must Have | 3.7 | Must Have — score 3.7/5: alto impacto de negocio (5/5), esfuerzo de implementaci... |
| RNF-01 | El sistema debe mantener un uptime del 99,99% para... | Must Have | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para ... |
| RNF-02 | El sistema debe garantizar una latencia de comunic... | Must Have | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para ... |
| RNF-04 | El backend debe ser capaz de coordinar hasta 1,000... | Must Have | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para ... |



---

## ANEXO B — Razonamiento de Clasificación

*Generado automáticamente por el Agente Extractor*


### B.1 — RF-01

**Descripción:** El sistema debe calcular la ruta de vuelo más corta evitando zonas de exclusión aérea (aeropuertos, zonas militares) mediante un algoritmo de planificación de rutas que considere las coordenadas geográficas de los aeropuertos y zonas militares.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La ruta calculada debe ser la más corta posible, con una diferencia máxima de 5% en comparación con la ruta óptima determinada por un algoritmo de planificación de rutas conocido (por ejemplo, Dijkstra o A").

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
**Criterio de Aceptación:** La disponibilidad del sistema de despacho no debe ser inferior al 99,99% durante cualquier período de observación de 30 días consecutivos.

---

### B.6 — RNF-02

**Descripción:** El sistema debe garantizar una latencia de comunicación entre el centro de control y el dron no superior a 50ms.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La latencia de comunicación entre el centro de control y el dron no supera los 50ms en más del 95% de las transacciones.

---

### B.7 — RNF-03

**Descripción:** El sistema debe verificar la firma digital de todos los comandos enviados al dron para evitar el secuestro de la unidad (Anti-spoofing).

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La aplicación debe validar con éxito la firma digital de cada comando enviado al dron utilizando un algoritmo de verificación de firmas digitales seguro y reconocido.

---

### B.8 — RNF-04

**Descripción:** El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad.

**Tipo:** No Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** número de drones coordinados correctamente

---

### B.9 — RD-01

**Descripción:** El sistema debe limitar la altura máxima de vuelo a los 120 metros (400 pies) para cumplir con la normativa de aviación civil local.

**Tipo:** Dominio
**Prioridad:** Alta
**Criterio de Aceptación:** La altura del drone en el momento del vuelo no supera los 120 metros (400 pies), verificada mediante la lectura de sensores de altitud integrados en el sistema.

---

### B.10 — RF-05

**Descripción:** El sistema debe bloquear automáticamente todos los despegues si la velocidad del viento detectada por la estación meteorológica supera los 40 km/h.

**Tipo:** Funcional
**Prioridad:** Alta
**Criterio de Aceptación:** La velocidad del viento detectada por la estación meteorológica debe ser superior a 40 km/h para que el sistema bloquee automáticamente todos los despegues.

---

### B.11 — RD-02

**Descripción:** El sistema debe rechazar cualquier ruta que comprometa la reserva de batería del dron para el aterrizaje de emergencia.

**Tipo:** Dominio
**Prioridad:** Alta
**Criterio de Aceptación:** La reserva de batería del dron debe ser mayor o igual al 20% después de consumir la energía estimada para cualquier ruta.

---


*Documento generado el 2026-05-02 12:45:44 · Sistema Multi-Agente de Ingeniería de Requisitos v1.0*