import sys

# sys.path.insert(0, r'E:\arcgisserver\directories\arcgissystem\arcgisinput\complementos\peligros')

from config import *
import arcpy

arcpy.env.overwriteOutput = True

def get_properties_feature(feature, prop):
	desc = arcpy.Describe(feature)
	if prop == "catalogPath":
		return desc.catalogPath
	elif prop == "path":
		return desc.path
	elif prop == "shapetype":
		return desc.shapetype	

class ThematicConsultation(Object):
	def __init__(self):
		self.input = arcpy.GetParameterAsText(0)
		self.queryEntity = arcpy.GetParameterAsText(1)
		self.params = Parameters()
		self.nameZip = self.params.ZipProp().name
		self.scratch = arcpy.env.scratchGDB

	def geometry_input(self):
		data = json.loads(self.input)
		feature = arcpy.AsShape(data, True)
		feature = self.input if type(self.input) == 'json':
		self.geom = arcpy.CopyFeatures_management(feature, 
												  os.path.join(self.scratch, "Geometry"))

	# OBTENER LA EXTENSION PARA LA EJECUCION DEL PROCESO
	def get_extent_process(self):
		result = arcpy.MinimumBoundingGeometry_management(self.geom, 
														  os.path.join(self.scratch, "Extent"), 
														  "ENVELOPE", "ALL")
		return result

	
	def process(self):
		arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(4326)
		self.geometry_input()
		shapetype = get_properties_feature(self.geom, "shapetype")
		print shapetype


	def main(self):
		if self.input in ("", None, "#", "0", 0) or self.queryEntity in ("", None, "#", "0", 0):
			pass
		else:
			self.process()

if __name__ == "__main__":
	poo = ThematicConsultation()
	poo.main()



