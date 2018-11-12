# -*- coding: utf-8 -*-
import os

# ///////////////////////////////////////////////////////////////////////////
# // Copyright © 2018 INGEMMET
# // Autor: Roy Yali Samaniego
# //
# // Definición de la clase 'Config' que almacena información necesaria como
# // rutas de archivos, nombre de feature class a utilizar, campos, etc.
# // Modifique los valores de las variables para permitir su reconfiguración
# // Servicio disponible en:
# // 
# //    http://rutadeservicio
# //
# ///////////////////////////////////////////////////////////////////////////


class Conection:
	def __init__(self):
		self.conn = r'Database Connections\BD_GEOCIENTIFICA.sde'

class Parameters:
	def __init__(self):
		self.param_01 = "input_json"
		self.param_02 = "query_entity"
		self.param_03 = "output_feature"
		self.param_04 = "output_json"
		self.param_05 = "output_zip"
		self.param_06 = "output_shapefile"

	def PoliticalLimits(self):
		conn = Conection().conn
		ds = 'DATA_GIS.DS_BASE_CATASTRAL_GEOWGS84'
		self.departamento 	= os.path.join(conn, ds, 'DATA_GIS.GPO_DEP_DEPARTAMENTO')
		self.provincia 		= os.path.join(conn, ds, 'DATA_GIS.GPO_DEP_PROVINCIA')
		self.distrito 		= os.path.join(conn, ds, 'DATA_GIS.GPO_DEP_DISTRITO')

	def ZipProp(self):
		self.name = "Result.zip"