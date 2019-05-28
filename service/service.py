import sys, os
# ONLY USE IN GEOPROCESSING SERVICE

# Ruta del servicio
sys.path.insert(0, r'D:\\aplicaciones\\geoproceso\\consultatematica')
path = os.path.dirname(os.path.dirname(__file__))
sys.path.append(path)
arcpy.AddMessage(path)

import main

if __name__ == "__main__":
    jsonClip = arcpy.GetParameterAsText(0)  # json suelto para cortar la entidad
    queryEntity = arcpy.GetParameterAsText(1)  # Codigo de la entidad a cortar
    queryClip   = arcpy.GetParameterAsText(2)  # Consulta especifica de la entidad a cortar
    poo = main.ConsultaTematica(jsonClip, queryEntity, queryClip)
    poo.main()