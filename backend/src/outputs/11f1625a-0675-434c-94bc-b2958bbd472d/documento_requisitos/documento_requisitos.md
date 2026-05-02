# SkyRoute Logistics — Especificación de Requisitos de Software

| | |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 2026-05-02 13:10:02 |
| **Generado por** | MoSCoW AI |
| **Total de requisitos** | 11 |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Descripción General del Sistema](#2-descripción-general-del-sistema)
3. [Interesados del Proyecto](#3-interesados-del-proyecto)
4. [Requisitos Funcionales](#4-requisitos-funcionales-rf)
5. [Requisitos No Funcionales](#5-requisitos-no-funcionales-rnf)
6. [Restricciones de Dominio](#6-restricciones-de-dominio-rd)
7. [Clasificación MoSCoW](#7-clasificación-moscow)
8. [Anexo — Razonamiento de Clasificación](#anexo--razonamiento-de-clasificación)

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento especifica los requisitos del sistema SkyRoute Logistics.

### 1.2 Alcance del Sistema

El sistema abarca las funcionalidades descritas en los requisitos listados a continuación.

### 1.3 Definiciones y Acrónimos

| Acrónimo | Definición |
|----------|-----------|
| RF | Requisito Funcional |
| RNF | Requisito No Funcional |
| RD | Restricción de Dominio |
| MoSCoW | Must Have / Should Have / Could Have / Won't Have |
| ISO 29148 | Estándar internacional para ingeniería de requisitos |

---

## 2. Descripción General del Sistema

El sistema ha sido diseñado para satisfacer las necesidades identificadas durante el proceso de ingeniería de requisitos.

---

## 3. Interesados del Proyecto

| Nombre | Rol | Responsabilidades |
|--------|-----|-------------------|
| **Ana García** | Product Manager | Define el backlog y prioridades |



---

## 4. Requisitos Funcionales (RF)


### RF-01

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe calcular la ruta de vuelo más corta evitando zonas de exclusión aérea (aeropuertos, zonas militares) mediante un algoritmo de planificación de rutas que considere las coordenadas geográficas de los aeropuertos y zonas militares. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La ruta calculada debe ser la más corta en términos de distancia y tiempo, y no intersectar con ninguna zona de exclusión aérea. |
| **Clasificación MoSCoW** | Must Have |


### RF-02

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe permitir al operador humano tomar el control remoto del dron en caso de emergencia mediante un 'Kill Switch' digital. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La funcionalidad de 'Kill Switch' se activa correctamente y permite al operador humano recuperar el control del dron en menos de 5 segundos desde la activación. |
| **Clasificación MoSCoW** | Must Have |


### RF-03

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe reprogramar automáticamente la entrega si los sensores del dron detectan obstáculos inesperados en la zona de aterrizaje. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | Los sensores del dron deben detectar al menos un obstáculo inesperado en la zona de aterrizaje y el sistema debe reprogramar la entrega dentro de 5 segundos. |
| **Clasificación MoSCoW** | Must Have |


### RF-04

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe bloquear automáticamente todos los despegues si la velocidad del viento detectada por la estación meteorológica supera los 40 km/h. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La velocidad del viento detectada por la estación meteorológica debe ser mayor o igual a 40 km/h para que el sistema bloquee todos los despegues. |
| **Clasificación MoSCoW** | Must Have |




---

## 5. Requisitos No Funcionales (RNF)


### RNF-01

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe mantener un uptime del 99,99% para evitar drones varados en el aire. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La disponibilidad del sistema de despacho no debe ser inferior al 99,99% durante cualquier período de observación de 30 días consecutivos. |
| **Clasificación MoSCoW** | Must Have |


### RNF-02

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe garantizar una latencia de comunicación entre el centro de control y el dron menor o igual a 50ms. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La medición de la latencia de comunicación entre el centro de control y el dron no debe superar los 50ms en más del 5% de las operaciones. |
| **Clasificación MoSCoW** | Must Have |


### RNF-03

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe verificar la firma digital de todos los comandos enviados al dron para evitar el secuestro de la unidad (Anti-spoofing). |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La aplicación debe validar con éxito la firma digital de cada comando enviado al dron utilizando un algoritmo de verificación de firmas digitales seguro y reconocido. |
| **Clasificación MoSCoW** | Must Have |


### RNF-04

| Campo | Detalle |
|-------|---------|
| **Descripción** | El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | condicion verificable y especifica |
| **Clasificación MoSCoW** | Must Have |


### RNF-05

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema no permitirá el despacho de pedidos que superen los 5kg, excediendo la capacidad de sustentación de los motores actuales. |
| **Prioridad** | Media |
| **Criterio de Aceptación** |  |
| **Clasificación MoSCoW** | Should Have |




---

## 6. Restricciones de Dominio (RD)


### RD-01

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe evitar que los drones vuelen a una altura superior a 120 metros (400 pies) para cumplir con la normativa de aviación civil local. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La altitud máxima permitida para el vuelo de los drones es inferior o igual a 120 metros (400 pies). |
| **Clasificación MoSCoW** | Must Have |


### RD-02

| Campo | Detalle |
|-------|---------|
| **Descripción** | El sistema debe rechazar cualquier ruta que comprometa la autonomía de energía del dron. |
| **Prioridad** | Alta |
| **Criterio de Aceptación** | La batería del dron debe tener al menos un 20% de reserva para el aterrizaje de emergencia después de calcular el consumo estimado de la ruta. |
| **Clasificación MoSCoW** | Must Have |




---

## 7. Clasificación MoSCoW

| ID | Descripción | Categoría | Score | Justificación |
|----|-------------|-----------|-------|---------------|
| RD-01 | El sistema debe evitar que los drones vuelen a una altu... | **Must Have** | 4.0 | Must Have — score 4.0/5: alto impacto de negocio (5/5), bajo coste de implementación (2/5)... |
| RD-02 | El sistema debe rechazar cualquier ruta que comprometa ... | **Must Have** | 4.0 | Must Have — score 4.0/5: alto impacto de negocio (5/5), bajo coste de implementación (2/5)... |
| RF-01 | El sistema debe calcular la ruta de vuelo más corta evi... | **Must Have** | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RF-02 | El sistema debe permitir al operador humano tomar el co... | **Must Have** | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RF-03 | El sistema debe reprogramar automáticamente la entrega ... | **Must Have** | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RF-04 | El sistema debe bloquear automáticamente todos los desp... | **Must Have** | 3.8 | Must Have — score 3.8/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RNF-03 | El sistema debe verificar la firma digital de todos los... | **Must Have** | 3.7 | Must Have — score 3.7/5: alto impacto de negocio (5/5), esfuerzo de implementación elevado... |
| RNF-01 | El sistema debe mantener un uptime del 99,99% para evit... | **Must Have** | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RNF-02 | El sistema debe garantizar una latencia de comunicación... | **Must Have** | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RNF-04 | El backend debe ser capaz de coordinar hasta 1,000 dron... | **Must Have** | 3.65 | Must Have — score 3.65/5: alto impacto de negocio (5/5). Requisito crítico para el MVP. |
| RNF-05 | El sistema no permitirá el despacho de pedidos que supe... | **Should Have** | 3.15 | Should Have — score 3.15/5: bloquea múltiples componentes del sistema. |



---

## Anexo — Razonamiento de Clasificación


### RF-01 — Funcional

**Descripción:** El sistema debe calcular la ruta de vuelo más corta evitando zonas de exclusión aérea (aeropuertos, zonas militares) mediante un algoritmo de planificación de rutas que considere las coordenadas geográficas de los aeropuertos y zonas militares.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La ruta calculada debe ser la más corta en términos de distancia y tiempo, y no intersectar con ninguna zona de exclusión aérea.

---

### RF-02 — Funcional

**Descripción:** El sistema debe permitir al operador humano tomar el control remoto del dron en caso de emergencia mediante un 'Kill Switch' digital.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La funcionalidad de 'Kill Switch' se activa correctamente y permite al operador humano recuperar el control del dron en menos de 5 segundos desde la activación.

---

### RF-03 — Funcional

**Descripción:** El sistema debe reprogramar automáticamente la entrega si los sensores del dron detectan obstáculos inesperados en la zona de aterrizaje.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** Los sensores del dron deben detectar al menos un obstáculo inesperado en la zona de aterrizaje y el sistema debe reprogramar la entrega dentro de 5 segundos.

---

### RNF-01 — No Funcional

**Descripción:** El sistema debe mantener un uptime del 99,99% para evitar drones varados en el aire.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La disponibilidad del sistema de despacho no debe ser inferior al 99,99% durante cualquier período de observación de 30 días consecutivos.

---

### RNF-02 — No Funcional

**Descripción:** El sistema debe garantizar una latencia de comunicación entre el centro de control y el dron menor o igual a 50ms.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La medición de la latencia de comunicación entre el centro de control y el dron no debe superar los 50ms en más del 5% de las operaciones.

---

### RNF-03 — No Funcional

**Descripción:** El sistema debe verificar la firma digital de todos los comandos enviados al dron para evitar el secuestro de la unidad (Anti-spoofing).

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La aplicación debe validar con éxito la firma digital de cada comando enviado al dron utilizando un algoritmo de verificación de firmas digitales seguro y reconocido.

---

### RNF-04 — No Funcional

**Descripción:** El backend debe ser capaz de coordinar hasta 1,000 drones simultáneamente por cada sector de la ciudad.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** condicion verificable y especifica

---

### RNF-05 — No Funcional

**Descripción:** El sistema no permitirá el despacho de pedidos que superen los 5kg, excediendo la capacidad de sustentación de los motores actuales.

**Prioridad declarada:** Media
**Criterio de Aceptación:** 

---

### RD-01 — Dominio

**Descripción:** El sistema debe evitar que los drones vuelen a una altura superior a 120 metros (400 pies) para cumplir con la normativa de aviación civil local.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La altitud máxima permitida para el vuelo de los drones es inferior o igual a 120 metros (400 pies).

---

### RF-04 — Funcional

**Descripción:** El sistema debe bloquear automáticamente todos los despegues si la velocidad del viento detectada por la estación meteorológica supera los 40 km/h.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La velocidad del viento detectada por la estación meteorológica debe ser mayor o igual a 40 km/h para que el sistema bloquee todos los despegues.

---

### RD-02 — Dominio

**Descripción:** El sistema debe rechazar cualquier ruta que comprometa la autonomía de energía del dron.

**Prioridad declarada:** Alta
**Criterio de Aceptación:** La batería del dron debe tener al menos un 20% de reserva para el aterrizaje de emergencia después de calcular el consumo estimado de la ruta.

---


*Generado con MoSCoW AI · 2026-05-02 13:10:02*