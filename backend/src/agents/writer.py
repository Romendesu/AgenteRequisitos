import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


class AgenteWriter:
    """
    Agente que genera documentos formales de requisitos en MD, PDF y DOCX.
    """
    
    def __init__(self):
        pass
    
    def cargar_datos(self, ruta_requisitos: str) -> Dict[str, Any]:
        """Carga los requisitos priorizados desde un archivo JSON."""
        with open(ruta_requisitos, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _extraer_requisitos(self, datos: Dict[str, Any]) -> List[Dict]:
        """
        Extrae la lista de requisitos desde diferentes estructuras de JSON.
        """
        requisitos = []
        
        # Caso 1: Estructura del priorizador (requisitos_priorizados.json)
        if "requisitos_priorizados" in datos:
            for item in datos["requisitos_priorizados"]:
                # Cada item es un MoscowScore
                req = {
                    "id": item.get("requisito_id", ""),
                    "tipo": self._detectar_tipo_por_id(item.get("requisito_id", "")),
                    "descripcion": item.get("justificacion", ""),
                    "criterio_aceptacion": "Verificar que el sistema cumpla con el requisito",
                    "prioridad": item.get("categoria_moscow", "Media"),
                    "score": item.get("score_final", 0),
                    "categoria_moscow": item.get("categoria_moscow", ""),
                    "justificacion": item.get("justificacion", ""),
                    "dimensiones": item.get("dimensiones", {})
                }
                requisitos.append(req)
        
        # Caso 2: Lista directa de requisitos
        elif isinstance(datos, list):
            for item in datos:
                if "id" in item:
                    requisitos.append(item)
        
        # Caso 3: Objeto con campo "requisitos"
        elif "requisitos" in datos:
            for item in datos["requisitos"]:
                requisitos.append(item)
        
        # Caso 4: Objeto con campo "requisito" individual
        elif "requisito" in datos:
            requisitos.append(datos["requisito"])
        
        # Caso 5: Intentar cargar archivos individuales de requisitos
        elif "metadata" in datos and "requisito" in datos:
            requisitos.append(datos["requisito"])
        
        return requisitos
    
    def _detectar_tipo_por_id(self, req_id: str) -> str:
        """Detecta el tipo de requisito por su ID."""
        if req_id.startswith("RF"):
            return "Funcional"
        elif req_id.startswith("RNF"):
            return "No Funcional"
        elif req_id.startswith("RD"):
            return "Dominio"
        else:
            return "Funcional"
    
    def _cargar_todos_requisitos(self, directorio: str = "outputs") -> List[Dict]:
        """
        Carga todos los requisitos individuales desde archivos JSON.
        """
        requisitos = []
        
        if not os.path.exists(directorio):
            return requisitos
        
        for archivo in os.listdir(directorio):
            if archivo.startswith("requisito_") and archivo.endswith(".json"):
                ruta = os.path.join(directorio, archivo)
                try:
                    with open(ruta, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if "requisito" in data:
                            requisitos.append(data["requisito"])
                except Exception:
                    pass
        
        return requisitos
    
    def _clasificar_requisitos_por_tipo(self, requisitos: List[Dict]) -> Dict[str, List]:
        """Clasifica los requisitos por tipo (Funcional, No Funcional, Dominio)."""
        clasificados = {
            "Funcional": [],
            "No Funcional": [],
            "Dominio": []
        }
        
        for req in requisitos:
            tipo = req.get("tipo", "")
            
            if not tipo:
                tipo = self._detectar_tipo_por_id(req.get("id", ""))
            
            if tipo == "Funcional":
                clasificados["Funcional"].append(req)
            elif tipo == "No Funcional":
                clasificados["No Funcional"].append(req)
            else:
                clasificados["Dominio"].append(req)
        
        return clasificados
    
    def _generar_markdown(self, datos: Dict[str, Any]) -> str:
        """Genera el contenido en formato Markdown."""
        
        # Intentar extraer requisitos
        requisitos = self._extraer_requisitos(datos)
        
        # Si no hay requisitos en el JSON, intentar cargar archivos individuales
        if not requisitos:
            requisitos = self._cargar_todos_requisitos()
        
        # Extraer metadata de priorizacion si existe
        moscow_labels = datos.get("moscow_labels", {})
        priority_scores = datos.get("priority_scores", {})
        conflict_report = datos.get("conflict_report", [])
        
        # Si no hay labels, extraer de requisitos
        if not moscow_labels and requisitos:
            for req in requisitos:
                req_id = req.get("id", "")
                if req_id:
                    moscow_labels[req_id] = req.get("categoria_moscow", "No definida")
                    priority_scores[req_id] = req.get("score", 0)
        
        # Clasificar requisitos
        clasificados = self._clasificar_requisitos_por_tipo(requisitos)
        
        fecha_generacion = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        
        markdown = f"""# DOCUMENTO DE REQUISITOS DE SOFTWARE

---

## Version: 1.0
## Fecha: {fecha_generacion}
## Estado: Aprobado

---

## 1. INTRODUCCION

### 1.1 Proposito del documento

El presente documento tiene como proposito definir, especificar y priorizar los requisitos funcionales, no funcionales y de dominio del sistema. Este documento servira como base para las fases de diseno, desarrollo y pruebas del proyecto.

### 1.2 Alcance del sistema

El sistema descrito en este documento abarca las funcionalidades y restricciones necesarias para satisfacer las necesidades identificadas durante la fase de elicitacion de requisitos. El alcance incluye:

- Registro y gestion de requisitos
- Validacion automatica de calidad de requisitos
- Priorizacion mediante metodologia MoSCoW
- Generacion de documentacion formal

### 1.3 Definiciones y acronimos

| Termino | Definicion |
|---------|------------|
| RF | Requisito Funcional - Accion que el sistema debe realizar |
| RNF | Requisito No Funcional - Cualidad o restriccion del sistema |
| RD | Requisito de Dominio - Regla de negocio o restriccion legal |
| MoSCoW | Metodologia de priorizacion (Must have, Should have, Could have, Won't have) |
| ISO/IEC 29148 | Estandar internacional para ingenieria de requisitos |

---

## 2. DESCRIPCION GENERAL

El sistema permitira gestionar el ciclo de vida de requisitos de software, incluyendo:

- **Extraccion automatica** de requisitos a partir de texto en lenguaje natural
- **Clasificacion inteligente** de requisitos (Funcional, No Funcional, Dominio)
- **Validacion de calidad** segun estandares ISO/IEC 29148
- **Priorizacion cuantificada** usando analisis multidimensional
- **Generacion de documentacion formal** en multiples formatos

### 2.1 Usuarios del sistema

| Actor | Descripcion |
|-------|-------------|
| Analista de Requisitos | Define y valida los requisitos del sistema |
| Desarrollador | Implementa los requisitos priorizados |
| Project Manager | Prioriza y planifica sprints basados en MoSCoW |
| Stakeholder | Valida que los requisitos cumplan con las necesidades del negocio |

### 2.2 Metodologia de priorizacion

La priorizacion se realiza mediante scoring cuantificado en 4 dimensiones:

| Dimension | Peso | Descripcion |
|-----------|------|-------------|
| Impacto en negocio | 40% | Valor aportado al usuario/cliente |
| Riesgo tecnico | 25% | Complejidad de implementacion |
| Esfuerzo estimado | 20% | Recursos necesarios (invertido: menos esfuerzo = mejor) |
| Dependencias | 15% | Numero de requisitos que bloquea |

---

## 3. REQUISITOS FUNCIONALES (RF)

"""
        
        if clasificados["Funcional"]:
            for i, req in enumerate(clasificados["Funcional"], 1):
                req_id = req.get("id", f"RF-{i:02d}")
                descripcion = req.get("descripcion", "No especificada")
                criterio = req.get("criterio_aceptacion", "No especificado")
                prioridad_original = req.get("prioridad", "Media")
                prioridad_moscow = moscow_labels.get(req_id, req.get("categoria_moscow", "No definida"))
                score = priority_scores.get(req_id, req.get("score", 0))
                
                markdown += f"""
### 3.{i} {req_id}

| Atributo | Valor |
|----------|-------|
| **ID** | {req_id} |
| **Descripcion** | {descripcion} |
| **Criterio de Aceptacion** | {criterio} |
| **Prioridad Original** | {prioridad_original} |
| **Prioridad MoSCoW** | {prioridad_moscow} |
| **Score Cuantificado** | {score}/5 |

"""
        else:
            markdown += "\n*No se identificaron requisitos funcionales.*\n"
        
        markdown += """
---

## 4. REQUISITOS NO FUNCIONALES (RNF)

"""
        
        if clasificados["No Funcional"]:
            for i, req in enumerate(clasificados["No Funcional"], 1):
                req_id = req.get("id", f"RNF-{i:02d}")
                descripcion = req.get("descripcion", "No especificada")
                criterio = req.get("criterio_aceptacion", "No especificado")
                prioridad_original = req.get("prioridad", "Media")
                prioridad_moscow = moscow_labels.get(req_id, req.get("categoria_moscow", "No definida"))
                score = priority_scores.get(req_id, req.get("score", 0))
                
                markdown += f"""
### 4.{i} {req_id}

| Atributo | Valor |
|----------|-------|
| **ID** | {req_id} |
| **Descripcion** | {descripcion} |
| **Criterio de Aceptacion** | {criterio} |
| **Prioridad Original** | {prioridad_original} |
| **Prioridad MoSCoW** | {prioridad_moscow} |
| **Score Cuantificado** | {score}/5 |

"""
        else:
            markdown += "\n*No se identificaron requisitos no funcionales.*\n"
        
        markdown += """
---

## 5. RESTRICCIONES DE DOMINIO (RD)

"""
        
        if clasificados["Dominio"]:
            for i, req in enumerate(clasificados["Dominio"], 1):
                req_id = req.get("id", f"RD-{i:02d}")
                descripcion = req.get("descripcion", "No especificada")
                criterio = req.get("criterio_aceptacion", "No especificado")
                prioridad_original = req.get("prioridad", "Media")
                prioridad_moscow = moscow_labels.get(req_id, req.get("categoria_moscow", "No definida"))
                score = priority_scores.get(req_id, req.get("score", 0))
                
                markdown += f"""
### 5.{i} {req_id}

| Atributo | Valor |
|----------|-------|
| **ID** | {req_id} |
| **Descripcion** | {descripcion} |
| **Criterio de Aceptacion** | {criterio} |
| **Prioridad Original** | {prioridad_original} |
| **Prioridad MoSCoW** | {prioridad_moscow} |
| **Score Cuantificado** | {score}/5 |

"""
        else:
            markdown += "\n*No se identificaron restricciones de dominio.*\n"
        
        # Tabla de priorizacion MoSCoW
        markdown += """
---

## 6. TABLA DE PRIORIZACION MOSCOW

### 6.1 Resumen por categoria

"""
        
        categorias = {"Must Have": [], "Should Have": [], "Could Have": [], "Won not Have": []}
        
        for req in requisitos:
            req_id = req.get("id", "")
            categoria = moscow_labels.get(req_id, req.get("categoria_moscow", ""))
            score = priority_scores.get(req_id, req.get("score", 0))
            justificacion = req.get("justificacion", req.get("descripcion", ""))
            
            if categoria in categorias:
                categorias[categoria].append({
                    "id": req_id,
                    "score": score,
                    "justificacion": justificacion
                })
        
        markdown += "| Categoria | Cantidad | Descripcion |\n|-----------|----------|-------------|\n"
        markdown += f"| **Must Have** | {len(categorias['Must Have'])} | Requisitos criticos, obligatorios para el exito del proyecto |\n"
        markdown += f"| **Should Have** | {len(categorias['Should Have'])} | Importantes pero hay alternativas |\n"
        markdown += f"| **Could Have** | {len(categorias['Could Have'])} | Deseables, pero no criticos |\n"
        markdown += f"| **Won't Have** | {len(categorias['Won not Have'])} | No se implementaran en este ciclo |\n"
        
        markdown += """
### 6.2 Detalle de requisitos por categoria

"""
        
        for categoria in ["Must Have", "Should Have", "Could Have", "Won not Have"]:
            if categorias[categoria]:
                markdown += f"\n#### {categoria}\n\n"
                markdown += "| ID | Score | Justificacion |\n|----|-------|---------------|\n"
                for req in categorias[categoria]:
                    justificacion_corta = req["justificacion"][:80] + "..." if len(req["justificacion"]) > 80 else req["justificacion"]
                    markdown += f"| {req['id']} | {req['score']} | {justificacion_corta} |\n"
        
        # Reporte de conflictos
        if conflict_report:
            markdown += """
---

## 7. CONFLICTOS DETECTADOS ENTRE REQUISITOS

| Requisito 1 | Requisito 2 | Tipo | Descripcion | Resolucion Sugerida |
|-------------|-------------|------|-------------|---------------------|
"""
            for conf in conflict_report:
                markdown += f"| {conf.get('requisito_1', '')} | {conf.get('requisito_2', '')} | {conf.get('tipo_conflicto', '')} | {conf.get('descripcion', '')} | {conf.get('resolucion_sugerida', '')} |\n"
        
        # Lista completa de requisitos
        markdown += """
---

## 8. LISTA COMPLETA DE REQUISITOS

"""
        
        for req in requisitos:
            req_id = req.get("id", "N/A")
            tipo = req.get("tipo", self._detectar_tipo_por_id(req_id))
            descripcion = req.get("descripcion", "No especificada")
            markdown += f"- **{req_id}** ({tipo}): {descripcion}\n"
        
        # Anexo
        markdown += f"""
---

## ANEXO B — Razonamiento del Classifier Agent

### B.1 Metodologia de clasificacion

El sistema utiliza un modelo de lenguaje (LLM) para clasificar automaticamente los requisitos en tres categorias:

1. **Funcional (RF)**: Describen acciones especificas que el sistema debe realizar. Ejemplo: "El sistema debe permitir registrar usuarios."

2. **No Funcional (RNF)**: Describen cualidades, atributos o restricciones del sistema. Ejemplo: "El sistema debe responder en menos de 2 segundos."

3. **Dominio (RD)**: Describen reglas de negocio o restricciones legales. Ejemplo: "Solo los administradores pueden eliminar datos."

### B.2 Criterios de validacion de calidad

El Agente Validador evalua cada requisito segun los siguientes criterios (ISO/IEC 29148):

| Criterio | Descripcion |
|----------|-------------|
| Claridad | El requisito es facil de entender sin ambiguedades |
| Atomicidad | El requisito describe una sola funcionalidad |
| Verificabilidad | El requisito puede ser probado objetivamente |
| Consistencia | No contradice otros requisitos |
| Trazabilidad | Puede ser rastreado a lo largo del ciclo de vida |

### B.3 Metodo de priorizacion cuantificada

El scoring se calcula mediante la formula:


**Interpretacion de scores:**
- Score >= 4.0: Must Have (Critico)
- Score >= 3.0 y < 4.0: Should Have (Importante)
- Score >= 2.0 y < 3.0: Could Have (Deseable)
- Score < 2.0: Won't Have (Descartado para este ciclo)

---

## HISTORIAL DE CAMBIOS

| Version | Fecha | Autor | Descripcion |
|---------|------|-------|--------------|
| 1.0 | {fecha_generacion} | Sistema de Gestion de Requisitos | Documento inicial generado automaticamente |

---

*Documento generado automaticamente por el Sistema de Gestion de Requisitos con IA*
"""
        
        return markdown
    
    def generar_documento(self, ruta_entrada: str = None, directorio_salida: str = "outputs/documento_requisitos") -> Dict[str, str]:
        """
        Genera el documento de requisitos en MD, PDF y DOCX.
        
        Args:
            ruta_entrada: Ruta al archivo requisitos_priorizados.json (opcional)
            directorio_salida: Directorio donde guardar los documentos
            
        Returns:
            Dict con las rutas de los archivos generados
        """
        datos = {}
        
        # Cargar datos desde JSON si se proporciona
        if ruta_entrada and os.path.exists(ruta_entrada):
            datos = self.cargar_datos(ruta_entrada)
        else:
            # Intentar cargar requisitos_priorizados.json por defecto
            ruta_default = "outputs/requisitos_priorizados.json"
            if os.path.exists(ruta_default):
                datos = self.cargar_datos(ruta_default)
        
        # Generar Markdown
        markdown_content = self._generar_markdown(datos)
        
        # Verificar que hay requisitos
        if "No se identificaron" in markdown_content and "No se especificada" in markdown_content:
            print("\n[Advertencia] No se encontraron requisitos para incluir en el documento.")
            print("Asegurate de haber procesado requisitos primero.")
        
        # Crear directorio de salida
        os.makedirs(directorio_salida, exist_ok=True)
        
        # Guardar archivo MD
        ruta_md = os.path.join(directorio_salida, "documento_requisitos.md")
        with open(ruta_md, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        
        # Generar PDF (requiere weasyprint)
        ruta_pdf = None
        try:
            ruta_pdf = self._generar_pdf(markdown_content, directorio_salida)
        except Exception as e:
            print(f"   [Advertencia] No se pudo generar PDF: {e}")
        
        # Generar DOCX (requiere python-docx)
        ruta_docx = None
        try:
            ruta_docx = self._generar_docx(markdown_content, directorio_salida)
        except Exception as e:
            print(f"   [Advertencia] No se pudo generar DOCX: {e}")
        
        resultado = {
            "md": ruta_md,
            "pdf": ruta_pdf,
            "docx": ruta_docx
        }
        
        print(f"\nDocumentos generados en: {directorio_salida}")
        print(f"  - Markdown: {ruta_md}")
        if ruta_pdf:
            print(f"  - PDF: {ruta_pdf}")
        if ruta_docx:
            print(f"  - DOCX: {ruta_docx}")
        
        return resultado
    
    def _generar_pdf(self, markdown_content: str, directorio_salida: str) -> Optional[str]:
        """Convierte Markdown a PDF usando weasyprint."""
        try:
            from weasyprint import HTML
            import markdown
            
            html_content = markdown.markdown(markdown_content, extensions=['tables'])
            
            html_completo = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        margin: 2cm;
                        line-height: 1.5;
                    }}
                    h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; }}
                    h2 {{ color: #34495e; border-bottom: 1px solid #bdc3c7; }}
                    h3 {{ color: #7f8c8d; }}
                    table {{
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1em 0;
                    }}
                    th, td {{
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #3498db;
                        color: white;
                    }}
                </style>
            </head>
            <body>
                {html_content}
            </body>
            </html>
            """
            
            ruta_pdf = os.path.join(directorio_salida, "documento_requisitos.pdf")
            HTML(string=html_completo).write_pdf(ruta_pdf)
            return ruta_pdf
            
        except ImportError:
            return None
    
    def _generar_docx(self, markdown_content: str, directorio_salida: str) -> Optional[str]:
        """Convierte Markdown a DOCX usando python-docx."""
        try:
            from docx import Document
            from docx.shared import Pt
            from docx.enum.text import WD_ALIGN_PARAGRAPH
            import re
            
            doc = Document()
            
            style = doc.styles['Normal']
            style.font.name = 'Arial'
            style.font.size = Pt(11)
            
            lines = markdown_content.split('\n')
            i = 0
            
            while i < len(lines):
                line = lines[i].strip()
                
                if line.startswith('# '):
                    doc.add_heading(line[2:], level=1)
                elif line.startswith('## '):
                    doc.add_heading(line[3:], level=2)
                elif line.startswith('### '):
                    doc.add_heading(line[4:], level=3)
                elif line.startswith('|') and '|' in line:
                    if i + 1 < len(lines) and lines[i+1].strip().startswith('|'):
                        tabla_lines = []
                        while i < len(lines) and lines[i].strip().startswith('|'):
                            tabla_lines.append(lines[i].strip())
                            i += 1
                        i -= 1
                        
                        rows = []
                        for tl in tabla_lines:
                            cells = [c.strip() for c in tl.split('|')[1:-1]]
                            rows.append(cells)
                        
                        if len(rows) > 1:
                            table = doc.add_table(rows=len(rows), cols=len(rows[0]))
                            table.style = 'Table Grid'
                            
                            for row_idx, row_data in enumerate(rows):
                                for col_idx, cell_data in enumerate(row_data):
                                    cell = table.cell(row_idx, col_idx)
                                    cell.text = cell_data
                                    if row_idx == 0:
                                        for run in cell.paragraphs[0].runs:
                                            run.bold = True
                elif line.startswith('- ') and not line.startswith('---'):
                    doc.add_paragraph(line[2:], style='List Bullet')
                elif line and not line.startswith('```') and not line.startswith('|---'):
                    if not line.startswith('|'):
                        doc.add_paragraph(line)
                
                i += 1
            
            ruta_docx = os.path.join(directorio_salida, "documento_requisitos.docx")
            doc.save(ruta_docx)
            return ruta_docx
            
        except ImportError:
            return None


if __name__ == "__main__":
    agente = AgenteWriter()
    resultado = agente.generar_documento()
    print(f"\nDocumentos generados exitosamente")