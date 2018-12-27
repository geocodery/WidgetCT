import sys, os
# ONLY USE IN GEOPROCESSING SERVICE

# Ruta del servicio
sys.path.insert(0, r'D:\\aplicativos\\geoprocesos\\consultatematica')
path = os.path.dirname(os.path.dirname(__file__))
sys.path.append(path)
arcpy.AddMessage(path)

try:
    for root, dirs, files in os.walk("consultatematica"):
        arcpy.AddMessage(root)
    arcpy.AddMessage("LISTADOS")
    arcpy.AddMessage(os.listdir(r'D:\\aplicativos'))
    arcpy.AddMessage(os.listdir(r'D:\\aplicativos\\complementos'))
    arcpy.AddMessage(os.listdir(r'D:\\aplicativos\\geoprocesos'))
    arcpy.AddMessage(os.listdir(r'D:\\aplicativos\\geoprocesos\\consultatematica'))
except:
    arcpy.AddMessage("paso")

import main

if __name__ == "__main__":
    jsonClip = arcpy.GetParameterAsText(0)  # json suelto para cortar la entidad
    queryEntity = arcpy.GetParameterAsText(1)  # Codigo de la entidad a cortar
    queryClip   = arcpy.GetParameterAsText(2)  # Consulta especifica de la entidad a cortar
    poo = main.ConsultaTematica(jsonClip, queryEntity, queryClip)
    poo.main()