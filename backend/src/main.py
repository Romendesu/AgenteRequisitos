import json
import os
from datetime import datetime
from src.agents.extractor import AgenteRequisitos
from src.agents.validator import AgenteValidador
from src.agents.prioritizer import AgentePriorizador
from src.agents.writer import AgenteWriter


def guardar_requisito_individual(requisito: dict, analisis: dict):
    """Guarda un requisito individual en formato estandar."""
    output_data = {
        "metadata": {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "requisito": requisito,
        "analisis": analisis
    }
    
    os.makedirs("outputs", exist_ok=True)
    nombre_archivo = f"outputs/requisito_{requisito['id']}.json"
    
    with open(nombre_archivo, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)
    
    return nombre_archivo


def mostrar_resultado(req, analisis):
    """Muestra el resultado del procesamiento."""
    print("\n" + "="*40)
    print(f"{req.id} - {req.tipo}")
    print("="*40)
    print(f"Descripcion: {req.descripcion}")
    print(f"Criterio: {req.criterio_aceptacion}")
    print(f"Prioridad sugerida: {req.prioridad}")
    print("-"*40)
    
    estado = "APROBADO" if analisis.es_valido else "RECHAZADO"
    print(f"Calidad: {analisis.puntuacion}/10 -> {estado}")
    
    if not analisis.es_valido:
        print(f"Errores: {', '.join(analisis.errores_detectados)}")
        print(f"Sugerencia: {analisis.sugerencias_mejora}")
    print("="*40)


def mostrar_resumen_priorizacion(resultado):
    """Muestra un resumen de la priorizacion."""
    print("\n" + "="*60)
    print("RESUMEN DE PRIORIZACION (MoSCoW)")
    print("="*60)
    
    categorias = {"Must Have": [], "Should Have": [], "Could Have": [], "Won not Have": []}
    
    for req in resultado.requisitos_priorizados:
        categorias[req.categoria_moscow].append(req)
    
    for categoria in ["Must Have", "Should Have", "Could Have", "Won not Have"]:
        if categorias[categoria]:
            print(f"\n{categoria} ({len(categorias[categoria])})")
            print("-" * 40)
            for req in categorias[categoria]:
                print(f"   - {req.requisito_id}: Score {req.score_final}")
                print(f"     Justificacion: {req.justificacion[:100]}...")


def main():
    extractor = AgenteRequisitos()
    validador = AgenteValidador()
    priorizador = AgentePriorizador()
    writer = AgenteWriter()
    
    requisitos_procesados = []
    
    print("="*60)
    print("SISTEMA DE GESTION DE REQUISITOS CON IA")
    print("="*60)
    print("Ingresa los requisitos uno por uno.")
    print("Deja el texto vacio y presiona Enter para finalizar.\n")
    
    while True:
        texto = input("Requisito: ").strip()
        
        if not texto:
            if requisitos_procesados:
                print("\nNo se ingresaron mas requisitos. Finalizando ingreso.")
            else:
                print("\nNo se ingreso ningun requisito. Saliendo.")
            break
        
        try:
            print("\nProcesando...")
            
            req = extractor.procesar_texto(texto)
            analisis = validador.validar(req.descripcion)
            mostrar_resultado(req, analisis)
            
            req_dict = req.model_dump()
            analisis_dict = analisis.model_dump()
            archivo = guardar_requisito_individual(req_dict, analisis_dict)
            print(f"\nGuardado en: {archivo}")
            
            requisitos_procesados.append(req_dict)
            
        except Exception as e:
            print(f"\n[ERROR] {str(e)}")
        
        print()
    
    # Priorizacion final si hay requisitos
    if len(requisitos_procesados) > 1:
        print("\n" + "="*60)
        print("PRIORIZACION DE REQUISITOS (MoSCoW)")
        print("="*60)
        
        priorizar = input(f"\nSe procesaron {len(requisitos_procesados)} requisitos. Desea priorizarlos? (s/n): ")
        
        if priorizar.lower() == 's':
            try:
                resultado = priorizador.priorizar(requisitos_procesados)
                
                archivo_priorizacion = "outputs/requisitos_priorizados.json"
                with open(archivo_priorizacion, "w", encoding="utf-8") as f:
                    json.dump(resultado.model_dump(), f, indent=4, ensure_ascii=False)
                
                print(f"\nPriorizacion guardada en: {archivo_priorizacion}")
                mostrar_resumen_priorizacion(resultado)
                
                # Generar documento formal
                print("\n" + "="*60)
                print("GENERANDO DOCUMENTO FORMAL")
                print("="*60)
                
                generar_doc = input("\nDesea generar el documento de requisitos? (s/n): ")
                if generar_doc.lower() == 's':
                    writer.generar_documento(archivo_priorizacion)
                        
            except Exception as e:
                print(f"\n[ERROR] Error en priorizacion: {str(e)}")
                import traceback
                traceback.print_exc()
    
    print("\nProceso completado.")


if __name__ == "__main__":
    main()