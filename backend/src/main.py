import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from pathlib import Path

from src.agents.extractor import AgenteRequisitos
from src.agents.validator import AgenteValidador
from src.agents.prioritizer import AgentePriorizador
from src.agents.writer import AgenteWriter

# ============================================================================
# Modelos Pydantic para la API
# ============================================================================

class RequisitoRequest(BaseModel):
    texto: str = Field(..., description="Texto del requisito en lenguaje natural", min_length=1)

class RequisitoResponse(BaseModel):
    id: str
    tipo: str
    descripcion: str
    prioridad: str
    criterio_aceptacion: str
    calidad: Dict[str, Any]

class PriorizacionRequest(BaseModel):
    requisitos_ids: Optional[List[str]] = Field(None, description="IDs específicos a priorizar (todos si es None)")

class DocumentoRequest(BaseModel):
    formato: str = Field("md", description="Formato: md, pdf, docx")
    incluir_todos: bool = Field(True, description="Incluir todos los requisitos o solo priorizados")

# ============================================================================
# Clase principal de la API
# ============================================================================

class GestorRequisitosAPI:
    def __init__(self):
        self.extractor = AgenteRequisitos()
        self.validador = AgenteValidador()
        self.priorizador = AgentePriorizador()
        self.writer = AgenteWriter()
        self.requisitos_procesados: Dict[str, Dict] = {}
        self.priorizacion_resultado: Optional[Dict] = None
        
        # Asegurar directorio de outputs
        os.makedirs("outputs", exist_ok=True)
        self._cargar_requisitos_guardados()
    
    def _cargar_requisitos_guardados(self):
        """Carga requisitos previamente guardados en archivos."""
        if not os.path.exists("outputs"):
            return
        
        for archivo in os.listdir("outputs"):
            if archivo.startswith("requisito_") and archivo.endswith(".json"):
                ruta = os.path.join("outputs", archivo)
                try:
                    with open(ruta, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if "requisito" in data:
                            req = data["requisito"]
                            self.requisitos_procesados[req["id"]] = req
                except Exception:
                    pass
    
    def _guardar_requisito(self, requisito: Dict, analisis: Dict) -> str:
        """Guarda un requisito individual."""
        output_data = {
            "metadata": {"fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
            "requisito": requisito,
            "analisis": analisis
        }
        
        nombre_archivo = f"outputs/requisito_{requisito['id']}.json"
        with open(nombre_archivo, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
        
        return nombre_archivo
    
    def procesar_requisito(self, texto: str) -> Dict[str, Any]:
        """Procesa un nuevo requisito."""
        # Extraer requisito
        req = self.extractor.procesar_texto(texto)
        
        # Validar calidad
        analisis = self.validador.validar(req.descripcion)
        
        # Convertir a dict
        req_dict = req.model_dump()
        analisis_dict = analisis.model_dump()
        
        # Guardar
        archivo = self._guardar_requisito(req_dict, analisis_dict)
        
        # Almacenar en memoria
        self.requisitos_procesados[req.id] = req_dict
        
        return {
            "requisito": req_dict,
            "calidad": analisis_dict,
            "archivo": archivo
        }
    
    def obtener_requisitos(self) -> List[Dict]:
        """Obtiene todos los requisitos."""
        return list(self.requisitos_procesados.values())
    
    def obtener_requisito(self, req_id: str) -> Optional[Dict]:
        """Obtiene un requisito por ID."""
        return self.requisitos_procesados.get(req_id)
    
    def eliminar_requisito(self, req_id: str) -> bool:
        """Elimina un requisito."""
        if req_id not in self.requisitos_procesados:
            return False
        
        # Eliminar archivo
        archivo = f"outputs/requisito_{req_id}.json"
        if os.path.exists(archivo):
            os.remove(archivo)
        
        # Eliminar de memoria
        del self.requisitos_procesados[req_id]
        
        # Limpiar priorización si existe
        self.priorizacion_resultado = None
        
        return True
    
    def eliminar_todos_requisitos(self) -> int:
        """Elimina todos los requisitos."""
        cantidad = len(self.requisitos_procesados)
        
        # Eliminar archivos
        for req_id in list(self.requisitos_procesados.keys()):
            archivo = f"outputs/requisito_{req_id}.json"
            if os.path.exists(archivo):
                os.remove(archivo)
        
        # Limpiar memoria
        self.requisitos_procesados.clear()
        self.priorizacion_resultado = None
        
        return cantidad
    
    def priorizar_requisitos(self, ids_especificos: Optional[List[str]] = None) -> Dict:
        """Prioriza los requisitos usando MoSCoW."""
        if not self.requisitos_procesados:
            raise ValueError("No hay requisitos para priorizar")
        
        # Filtrar por IDs si se especifican
        if ids_especificos:
            requisitos = [self.requisitos_procesados[rid] for rid in ids_especificos if rid in self.requisitos_procesados]
        else:
            requisitos = list(self.requisitos_procesados.values())
        
        if not requisitos:
            raise ValueError("No se encontraron los requisitos especificados")
        
        # Realizar priorización
        resultado = self.priorizador.priorizar(requisitos)
        self.priorizacion_resultado = resultado.model_dump()
        
        # Guardar resultado
        archivo = "outputs/requisitos_priorizados.json"
        with open(archivo, "w", encoding="utf-8") as f:
            json.dump(self.priorizacion_resultado, f, indent=4, ensure_ascii=False)
        
        return self.priorizacion_resultado
    
    def obtener_priorizacion(self) -> Optional[Dict]:
        """Obtiene el último resultado de priorización."""
        return self.priorizacion_resultado
    
    def generar_documento(self, background_tasks: BackgroundTasks) -> Dict:
        """Genera documento formal de requisitos."""
        if not self.requisitos_procesados:
            raise ValueError("No hay requisitos para generar documento")
        
        # Crear archivo temporal con requisitos actuales
        temp_file = "outputs/temp_requisitos.json"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(list(self.requisitos_procesados.values()), f, indent=4, ensure_ascii=False)
        
        # Generar documento
        resultado = self.writer.generar_documento(temp_file)
        
        # Limpiar archivo temporal
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        return resultado
    
    def descargar_documento(self, formato: str) -> Optional[str]:
        """Obtiene la ruta del documento en el formato solicitado."""
        formato = formato.lower()
        
        ruta_base = "outputs/documento_requisitos"
        
        mapeo = {
            "md": f"{ruta_base}/documento_requisitos.md",
            "pdf": f"{ruta_base}/documento_requisitos.pdf",
            "docx": f"{ruta_base}/documento_requisitos.docx"
        }
        
        if formato not in mapeo:
            return None
        
        ruta = mapeo[formato]
        if os.path.exists(ruta):
            return ruta
        
        return None


# ============================================================================
# Inicialización de FastAPI
# ============================================================================

app = FastAPI(
    title="API de Gestión de Requisitos con IA",
    description="""
    Sistema de gestión de requisitos de software utilizando IA.
    
    Características:
    - Extracción automática de requisitos desde lenguaje natural
    - Validación de calidad según ISO/IEC 29148
    - Priorización cuantificada usando metodología MoSCoW
    - Generación de documentación formal (MD, PDF, DOCX)
    """,
    version="1.0.0"
)

# Instancia global del gestor
gestor = GestorRequisitosAPI()


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Verificar estado de la API."""
    return {
        "status": "online",
        "version": "1.0.0",
        "requisitos_cargados": len(gestor.requisitos_procesados),
        "priorizacion_disponible": gestor.priorizacion_resultado is not None,
        "endpoints": [
            "POST /requisitos",
            "GET /requisitos",
            "GET /requisitos/{id}",
            "DELETE /requisitos/{id}",
            "DELETE /requisitos",
            "POST /requisitos/priorizar",
            "GET /priorizacion",
            "POST /documento",
            "GET /documento/{formato}"
        ]
    }


@app.post("/requisitos", response_model=Dict, status_code=201, tags=["Requisitos"])
async def crear_requisito(request: RequisitoRequest):
    """
    Procesa un nuevo requisito a partir de texto en lenguaje natural.
    
    - Extrae automáticamente tipo, descripción, prioridad y criterio de aceptación
    - Valida la calidad del requisito
    - Guarda el resultado en archivo JSON
    """
    try:
        resultado = gestor.procesar_requisito(request.texto)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando requisito: {str(e)}")


@app.get("/requisitos", tags=["Requisitos"])
async def listar_requisitos():
    """Obtiene todos los requisitos procesados."""
    requisitos = gestor.obtener_requisitos()
    return {
        "total": len(requisitos),
        "requisitos": requisitos
    }


@app.get("/requisitos/{req_id}", tags=["Requisitos"])
async def obtener_requisito(req_id: str):
    """Obtiene un requisito específico por su ID."""
    requisito = gestor.obtener_requisito(req_id)
    if not requisito:
        raise HTTPException(status_code=404, detail=f"Requisito {req_id} no encontrado")
    return requisito


@app.delete("/requisitos/{req_id}", tags=["Requisitos"])
async def eliminar_requisito(req_id: str):
    """Elimina un requisito específico."""
    eliminado = gestor.eliminar_requisito(req_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail=f"Requisito {req_id} no encontrado")
    return {"message": f"Requisito {req_id} eliminado correctamente"}


@app.delete("/requisitos", tags=["Requisitos"])
async def eliminar_todos_requisitos():
    """Elimina todos los requisitos."""
    cantidad = gestor.eliminar_todos_requisitos()
    return {"message": f"Se eliminaron {cantidad} requisitos"}


@app.post("/requisitos/priorizar", tags=["Priorización"])
async def priorizar_requisitos(request: Optional[PriorizacionRequest] = None):
    """
    Prioriza los requisitos usando metodología MoSCoW cuantificada.
    
    Evalúa 4 dimensiones:
    - Impacto en negocio (40%)
    - Riesgo técnico (25%)
    - Esfuerzo estimado (20%)
    - Dependencias (15%)
    """
    try:
        ids = request.requisitos_ids if request else None
        resultado = gestor.priorizar_requisitos(ids)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en priorización: {str(e)}")


@app.get("/priorizacion", tags=["Priorización"])
async def obtener_priorizacion():
    """Obtiene el último resultado de priorización."""
    resultado = gestor.obtener_priorizacion()
    if not resultado:
        raise HTTPException(status_code=404, detail="No hay una priorización disponible. Ejecuta POST /requisitos/priorizar primero")
    return resultado


@app.post("/documento", tags=["Documentación"])
async def generar_documento(request: DocumentoRequest = DocumentoRequest()):
    """
    Genera documento formal de requisitos en formato MD, PDF o DOCX.
    """
    try:
        # Verificar que hay requisitos
        if not gestor.requisitos_procesados:
            raise HTTPException(status_code=400, detail="No hay requisitos para generar documento")
        
        # Crear archivo temporal con la estructura que espera el writer
        temp_file = "outputs/temp_requisitos.json"
        
        # Estructura que espera el writer (con campo "requisitos")
        data_con_estructura = {
            "requisitos": list(gestor.requisitos_procesados.values())
        }
        
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data_con_estructura, f, indent=4, ensure_ascii=False)
        
        # Generar documento (esto genera MD, PDF y DOCX)
        resultado = gestor.writer.generar_documento(temp_file)
        
        # Limpiar archivo temporal
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        # Verificar si el formato solicitado está disponible
        formato = request.formato.lower()
        
        if formato == "md":
            ruta = resultado.get("md")
            if ruta and os.path.exists(ruta):
                return {
                    "message": f"Documento en formato Markdown generado",
                    "ruta": ruta,
                    "descargar": f"/documento/md"
                }
        elif formato == "pdf":
            ruta = resultado.get("pdf")
            if ruta and os.path.exists(ruta):
                return {
                    "message": f"Documento en formato PDF generado",
                    "ruta": ruta,
                    "descargar": f"/documento/pdf"
                }
        elif formato == "docx":
            ruta = resultado.get("docx")
            if ruta and os.path.exists(ruta):
                return {
                    "message": f"Documento en formato DOCX generado",
                    "ruta": ruta,
                    "descargar": f"/documento/docx"
                }
        
        # Si el formato no está disponible, devolver todos
        return {
            "message": "Documentos generados exitosamente",
            "archivos": {k: v for k, v in resultado.items() if v},
            "descargar": {
                "md": "/documento/md" if resultado.get("md") else None,
                "pdf": "/documento/pdf" if resultado.get("pdf") else None,
                "docx": "/documento/docx" if resultado.get("docx") else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando documento: {str(e)}")


@app.get("/documento/{formato}", tags=["Documentación"])
async def descargar_documento(formato: str):
    """
    Descarga el documento generado en el formato especificado.
    
    Formatos soportados: md, pdf, docx
    """
    formato = formato.lower()
    
    if formato not in ["md", "pdf", "docx"]:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {formato}. Usa: md, pdf, docx")
    
    # Primero intentar obtener documento existente
    ruta = gestor.descargar_documento(formato)
    
    # Si no existe, generarlo automáticamente
    if not ruta:
        try:
            # Generar documento con los requisitos actuales
            temp_file = "outputs/temp_requisitos.json"
            data_con_estructura = {
                "requisitos": list(gestor.requisitos_procesados.values())
            }
            
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data_con_estructura, f, indent=4, ensure_ascii=False)
            
            resultado = gestor.writer.generar_documento(temp_file)
            
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            ruta = resultado.get(formato)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generando documento: {str(e)}")
    
    if not ruta or not os.path.exists(ruta):
        raise HTTPException(
            status_code=404, 
            detail=f"Documento en formato {formato} no encontrado. Primero ejecuta POST /documento"
        )
    
    # Definir content-type
    content_types = {
        "md": "text/markdown",
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    
    nombre_archivo = f"documento_requisitos.{formato}"
    
    return FileResponse(
        path=ruta,
        media_type=content_types.get(formato, "application/octet-stream"),
        filename=nombre_archivo
    )


# ============================================================================
# Endpoints adicionales (estadísticas y resúmenes)
# ============================================================================

@app.get("/estadisticas", tags=["Estadísticas"])
async def obtener_estadisticas():
    """Obtiene estadísticas de los requisitos procesados."""
    requisitos = gestor.obtener_requisitos()
    
    tipos = {}
    prioridades = {}
    
    for req in requisitos:
        tipo = req.get("tipo", "Desconocido")
        prioridad = req.get("prioridad", "Desconocida")
        tipos[tipo] = tipos.get(tipo, 0) + 1
        prioridades[prioridad] = prioridades.get(prioridad, 0) + 1
    
    return {
        "total_requisitos": len(requisitos),
        "por_tipo": tipos,
        "por_prioridad_inicial": prioridades,
        "priorizacion_disponible": gestor.priorizacion_resultado is not None
    }


@app.get("/resumen", tags=["Estadísticas"])
async def obtener_resumen():
    """Obtiene un resumen ejecutivo de la priorización."""
    if not gestor.priorizacion_resultado:
        raise HTTPException(status_code=404, detail="No hay priorización disponible")
    
    resultado = gestor.priorizacion_resultado
    
    categorias = {"Must Have": 0, "Should Have": 0, "Could Have": 0, "Won't Have": 0}
    
    for req in resultado.get("requisitos_priorizados", []):
        cat = req.get("categoria_moscow", "")
        if cat in categorias:
            categorias[cat] += 1
    
    # Calcular score promedio
    scores = [req.get("score_final", 0) for req in resultado.get("requisitos_priorizados", [])]
    score_promedio = sum(scores) / len(scores) if scores else 0
    
    return {
        "resumen_moscow": categorias,
        "score_promedio": round(score_promedio, 2),
        "cantidad_conflictos": len(resultado.get("conflict_report", [])),
        "fecha_priorizacion": resultado.get("metadata", {}).get("fecha"),
        "metodo": resultado.get("metadata", {}).get("metodo")
    }


# ============================================================================
# Script principal (para ejecución directa)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("API DE GESTION DE REQUISITOS CON IA")
    print("=" * 60)
    print("\nEjecutando servidor FastAPI...")
    print("Documentación interactiva: http://localhost:8000/docs")
    print("Documentación alternativa: http://localhost:8000/redoc")
    print("\nEndpoints disponibles:")
    print("  POST   /requisitos           - Procesar nuevo requisito")
    print("  GET    /requisitos           - Listar todos los requisitos")
    print("  GET    /requisitos/{id}      - Obtener requisito específico")
    print("  DELETE /requisitos/{id}      - Eliminar requisito")
    print("  DELETE /requisitos           - Eliminar todos")
    print("  POST   /requisitos/priorizar - Priorizar requisitos (MoSCoW)")
    print("  GET    /priorizacion         - Ver resultado de priorización")
    print("  POST   /documento            - Generar documento formal")
    print("  GET    /documento/{formato}  - Descargar documento")
    print("  GET    /estadisticas         - Ver estadísticas")
    print("  GET    /resumen              - Ver resumen ejecutivo")
    print("\n" + "=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)