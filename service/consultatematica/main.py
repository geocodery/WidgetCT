import sys
# ONLY USE IN GEOPROCESSIN SERVICE
sys.path.insert(0, r'D:\\aplicativos\\geoprocesos\\consultatematica')

from config import *
from model import *
import arcpy
import json
import os
import zipfile

arcpy.env.overwriteOutput = True

class ConsultaTematica(object):
    def __init__(self, jsonClip, queryEntity, query):
        if jsonClip is None:
            self.jsonClip = None  # Area a cortar como JSON
        else:
            self.jsonClip = jsonClip
        self.queryEntity = queryEntity  # Servicio que se requiere (como feature) como JSON
        self.query   = query
        self.nameZip = Parameters().ZipProp
        self.scratch = arcpy.env.scratchGDB

    # OBTENER LA EXTENSION PARA LA EJECUCION DEL PROCESO
    def get_extent_process(self, area):
        result = arcpy.MinimumBoundingGeometry_management(area,
                                                          os.path.join(self.scratch, "Extent"),
                                                          "ENVELOPE", "ALL")
        return result

    def get_extent_env(self, ext, format=1):
        desc = arcpy.Describe(ext)
        extStr = desc.extent.JSON
        extJson = json.loads(extStr)
        if format == 1:
            text = "{} {} {} {}".format(extJson["xmin"], extJson["ymin"],
                                        extJson["xmax"], extJson["ymax"])
            return text
        else:
            return extJson

    def json2ft(self):
        data = json.loads(self.jsonClip)
        feature = arcpy.AsShape(data, True)
        self.geom = arcpy.CopyFeatures_management(feature,
                                             os.path.join(self.scratch, "Geometry"))

    def selectEntity(self): 
        if int(self.queryEntity) == 1:
            path = Parameters().capa1
        elif int(self.queryEntity) == 2:
            path = Parameters().capa2
        elif int(self.queryEntity) == 3:
            path = Parameters().capa3
        elif int(self.queryEntity) == 4:
            path = Parameters().capa4
        elif int(self.queryEntity) == 5:
            path = Parameters().capa5
        elif int(self.queryEntity) == 6:
            path = Parameters().capa6
        self.path = path
        

    def clipFeature(self):
        if self.jsonClip:
            self.json2ft()
            areaClip = arcpy.Clip_analysis(self.path, self.geom, os.path.join(self.scratch, "temp"))
        else:
            areaClip = self.path
        self.mflQuery = arcpy.MakeFeatureLayer_management(areaClip, "mflQuery", self.query)
        res = arcpy.CopyFeatures_management(self.mflQuery, os.path.join(arcpy.env.scratchFolder, "ResultInfo.shp"))
        return res

    def compress(self, dirnameElm, name):
        zp = zipfile.ZipFile(os.path.join(arcpy.env.scratchFolder, self.nameZip), "w", zipfile.ZIP_DEFLATED)
        info = [os.path.join(dirnameElm, x) for x in os.listdir(dirnameElm) if x[0:10] == name]
        for x in info:
            try:
                zp.write(x, os.path.basename(x))
            except:
                pass
        zp.close()
        return zp.filename

    def get_properties_feature(self, feature, prop):
        desc = arcpy.Describe(feature)
        if prop == "catalogPath":
            return desc.catalogPath
        elif prop == "path":
            return desc.path
        elif prop == "shapetype":
            return desc.shapetype

    def process(self):
        arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)
        # Seleccionar entidad
        self.selectEntity()
        # Seleccionar area o todos los elementos
        if self.jsonClip != None:
            lenfeature=len([x[0] for x in arcpy.da.SearchCursor(self.path, ["OID@"], self.query)])
            if lenfeature>10000 and self.query:
                errorMsg = "Se ha sobrepasado el limite de la consulta, favor de disminuir el area de la consulta o hacer una consulta mas especifica"
                arcpy.AddMessage(errorMsg)
                # arcpy.SetParameterAsText(6, outErrorMsg) #
            else:
                clipFt = self.clipFeature()

                extent_geometry = self.get_extent_process(clipFt)
                outExt = self.get_extent_env(extent_geometry, 2)

                dirnamepath = self.get_properties_feature(clipFt, "path")
                outzip = self.compress(dirnamepath, "ResultInfo")

                arcpy.SetParameterAsText(3, clipFt)  #
                arcpy.SetParameterAsText(4, outzip)  #
                arcpy.SetParameterAsText(5, outExt)  #

    def main(self):
        if self.jsonClip in ("#", "0", 0) or self.queryEntity in ("", None, "#", "0", 0):
            pass
        else:
            self.process()

# if __name__ == "__main__":
#     poo = ConsultaTematica()
#     poo.main()