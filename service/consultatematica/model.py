# -*- coding: utf-8 -*-
from config import *

# class Connection(object):
#     def __init__(self):
#         print os.path.join(BASE_DIR, r'config\bdgeocat_publ_gis.sde')
#         self.conn = r'\\SRVGEOAPP01\geoprocesos\config\bdgeocat_publ_gis.sde'
#         print self.conn

class Parameters(object):
    def __init__(self):
        self.param_01 = "input_json"
        self.param_02 = "query_feature_DB"

        self.param_03 = "output_feature"
        self.param_04 = "output_zip"
        self.param_05 = "output_extend"
        self.ds =  'DATA_GIS.DS_GEOLOGIA_INTEGRADA_100K'

    @property
    def capa1(self):
        self.name = 'DATA_GIS.PL_0101009_SECCIONHOJA'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path
    
    @property
    def capa2(self):
        self.name = 'DATA_GIS.PL_0101004_BUZAMIENTO'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path

    @property
    def capa3(self):
        self.name = 'DATA_GIS.PL_0101001_FALLA'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path

    @property
    def capa4(self):
        self.name = 'DATA_GIS.PL_0101007_PLIEGUEHOJA'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path

    @property
    def capa5(self):
        self.name = 'DATA_GIS.PL_0101005_CONTACTOHOJA'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path

    @property
    def capa6(self):
        self.name = 'DATA_GIS.PO_0101003_GEOLOGIA'
        self._path = os.path.join(CONN, self.ds, self.name)
        return self._path

    @property
    def ZipProp(self):
        self.name = "Result.zip"
        return self.name