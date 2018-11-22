define([
        "dojo/_base/declare",
        "jimu/BaseWidget",
        "jimu/portalUrlUtils",
        "jimu/portalUtils",
        "dijit/form/Button",
        "dijit/form/ComboBox",
        "dijit/registry",
        "dojo",
        "dojo/_base/array",
        "dojo/_base/lang",
        "dojo/dom",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/fx",
        "dojo/json",
        "dojo/on",
        "dojo/parser",
        "dojo/query",
        "dojo/store/Memory",
        "dojo/string",
        "dijit/form/MultiSelect",
        "esri/Color",
        "esri/geometry/Circle",
        "esri/geometry/geometryEngine",
        "esri/geometry/normalizeUtils",
        "esri/geometry/scaleUtils",
        "esri/graphic",
        "esri/InfoTemplate",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/layers/GraphicsLayer",
        "esri/renderers/SimpleRenderer",
        "esri/request",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/tasks/BufferParameters",
        "esri/tasks/Geoprocessor",
        "esri/tasks/JobInfo",
        "esri/tasks/GeometryService",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/toolbars/draw",
        "dojo/domReady!"
      ], function ( declare,
                    BaseWidget,
                    portalUrlUtils,
                    portalUtils,
                    Button,
                    ComboBox,
                    registry,
                    dojo,
                    arrayUtils,
                    lang,
                    dom,
                    domAttr,
                    domClass,
                    domConstruct,
                    coreFx,
                    JSON,
                    on,
                    parser,
                    query,
                    Memory,
                    dojoString,
                    MultiSelect,
                    Color,
                    Circle,
                    geometryEngine,
                    normalizeUtils,
                    scaleUtils,
                    Graphic,
                    InfoTemplate,
                    ArcGISDynamicMapServiceLayer,
                    FeatureLayer,
                    GraphicsLayer,
                    SimpleRenderer,
                    esriRequest,
                    PictureMarkerSymbol,
                    SimpleFillSymbol,
                    SimpleLineSymbol,
                    SimpleMarkerSymbol,
                    BufferParameters,
                    Geoprocessor,
                    JobInfo,
                    GeometryService,
                    Query,
                    QueryTask,
                    Draw,
                    domReady
        ) {
        parser.parse();
        // Variables del servicio de geometria
        esriConfig.defaults.geometryService = new GeometryService("http://geocatmin.ingemmet.gob.pe/arcgis/rest/services/Utilities/Geometry/GeometryServer"); 
        esriConfig.defaults.io.proxyUrl = "/proxy/";
        esriConfig.defaults.io.alwaysUseProxy = false;
        var portalUrl = "http://www.arcgis.com";

        // CREACION DEL WIDGET
        return declare([BaseWidget], {

        
        baseClass: 'ConsultaTematicaGeologica',  // Clase principal para CSS
        postCreate: function() {        // Ejecuta despues de crearse
          this.inherited(arguments);
          self = this;
          console.log('ConsultaTematicaGeologica::postCreate');
        },

        // Ejecuta al abrir widget 
        startup: function () {
            this.inherited(arguments);  
            self._createToolbarCtg();
            self._searchServiceCtg();
            self = this;
            self._ValuesfromFieldCtg();
            self.startupAddShpCtg();
            console.log('ConsultaTematicaGeologica::startup');
        },

        // Configuracion de ventana de trabajo
        onOpen: function(){
          console.log('ConsultaTematicaGeologica::onOpen');
          var panel = this.getPanel();
          panel.position.height = 700;
          panel.setPosition(panel.position);
          panel.panelManager.normalizePanel(panel);
        },

        // Configuracion del cambio entre pestañas
        _onchangetabCtg: function(evt){
            var currentid = evt.target.id;
            self._activeclassCtg("methodCtg", currentid);
            if (currentid == "selectbtnCtg"){
                self._activeclassCtg("tabcontentCtg", "selectCtg");
              }
            if (currentid == "drawbtnCtg"){
                self._activeclassCtg("tabcontentCtg", "drawCtg")
              }
            if(currentid == "resbtnCtg"){
                self._activeclassCtg("tabcontentCtg", "resultCtg")
                tb.deactivate();
              }
        },

        // Activa y desactiva clases
        _activeclassCtg: function(offclass, onid){
            var tab = query("." + offclass);
            for(i = 0; i < tab.length; i++){
                domClass.remove(tab[i].id, "active");
            }
            domClass.add(onid, "active");
        },

        // Cambia el color de las herramientas de dibujo
        _changeColorToolbarCtg: function(onid){
            var array = ["point", "polyline", "polygon"];
            for (i=0; i < array.length; i++){
                if (array[i] != onid){
                    dojo.byId(array[i]).style.backgroundColor = "#ddd";
                }
                else{
                    dojo.byId(onid).style.backgroundColor = "#808080";
                }
            }
        },

        // *************************************************************
        // * BUSQUEDA DEL DATO DE SERVICIO

        // Selecciona la url del servicio
        _selectUrlServiceCtg: function(code){
          // "http://geocatmin.ingemmet.gob.pe/arcgis/rest/services/SERV_GEOLOGIA_INTEGRADA_v2/MapServer/"
          var url=self.config.serviceGeo;
          url=url.concat(code);
          return url;
        },

        // Busca y llama al servicio buscado
        _searchServiceCtg: function(){
          on(dom.byId("queryentityCtg"), "change", function () {
            self.codeCtg = dom.byId("queryentityCtg").value
            var urlService = self._selectUrlServiceCtg(self.codeCtg);
            var requestHandle = esriRequest({
              "url": urlService,
              "content": {
                "f": "json" 
              },
              "callbackParamName": "callback"
            });
            requestHandle.then(self._requestSucceededCtg, self._errorHandlerCtg);
          });
        },

        // Agrega los campos recogidos del servicio
        _requestSucceededCtg: function(response, io){
          var fieldInfo;
          var FieldNames = [];
          console.log("Fields");
          if ( response.hasOwnProperty("fields")) {
            fieldInfo = arrayUtils.map(response.fields, function(f) {
              FieldNames.push({"Field": f.name, "Alias": f.alias});
            });
          };
          var FieldNames = new Memory({
                        data: FieldNames
                    });
          var comboField = registry.byId("itemsFieldsCtg");
          if(comboField) {
              comboField.store = FieldNames;
          }else {
              comboField = new ComboBox({
                  id: "itemsFieldsCtg",
                  store: FieldNames,
                  searchAttr: "Field"},
                  "itemsFieldsCtg"
                  );
                };
        },

        // Funcionalidad de hacer query al campo seleccionado considerando un parámetro
        _ValuesfromFieldCtg :function(){
          var query = new Query();
          on(dom.byId("searchDescCtg"), "click", function(evt){
            var urlService = self._selectUrlServiceCtg(dom.byId("queryentityCtg").value);
            var queryTask = new QueryTask(urlService);
            var layer = new FeatureLayer(urlService, {
                  mode: FeatureLayer.MODE_ONDEMAND,
                  outFields: ["*"],
              opacity: 0.9,
              visible: true
            });
            var nameSearch = dom.byId("searchValueCtg").value;
            query.text = dom.byId("itemsFieldsCtg").value;
            query.outFields =  ["*"];
            
            self.sqlCtg = "UPPER(" + query.text + ") LIKE UPPER('%" + nameSearch + "%')";
            query.where = self.sqlCtg;
            query.returnGeometry = true;
            query.outSpatialReference = {wkid:102100};
            console.log(query);
            queryTask.execute(query).then(self._showFieldValuesCtg, self._errorHandlerCtg);
          });
        },

        //Muestra los resultados encontrados
        _showFieldValuesCtg: function(resultado) {
          
          if(resultado.value){
            var results = resultado.value;
          }else{
            self._activeContainersCtg("infoCtg", true);
            var results = resultado;
          }

          var resultItems = [];
          var resultCount = results.features.length;
          var FieldValues = [];
          var inputGeom = JSON.stringify(results).replace(/['"]+/g, '\'');
          for(i = 0; i < results.features.length; i++){
            var geomType = results.geometryType;
          }

          for (var i = 0; i < resultCount; i++) {
            var featureAttributes = results.features[i].attributes;
            for (var attr in featureAttributes) {
              if(attr == dom.byId("itemsFieldsCtg").value){
                FieldValues.push(featureAttributes[attr]);
              }
            }
          }
          var uniqueFields = Array.from(new Set(FieldValues));
          uniqueFields.sort();
          var showValues = [];
          showValues.push("<ul>");
          for (var i = uniqueFields.length - 1; i >= 0; i--) {
            showValues.push("<li>" + uniqueFields[i] + "</li>");
          }
          showValues.push("</ul>");
          dom.byId("infoCtg").innerHTML = showValues.join("");

          var graphicsLayer = new GraphicsLayer();
          var markerSymbol = new PictureMarkerSymbol({
                                style: "square",
                                color: "blue",
                              });
          var polylSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([112, 112, 112]), 1);
          var polygSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));

          var geomType = results.geometryType;

          arrayUtils.forEach(results.features, function(feature) {
            if(geomType == 'esriGeometryPoint'){
              feature.setSymbol(markerSymbol);
            }
            if(geomType == 'esriGeometryPolyline'){
              feature.setSymbol(polylSymbol);
            }
            if(geomType == 'esriGeometryPolygon'){
              feature.setSymbol(polygSymbol);
            }
            graphicsLayer.add(feature);
          }),
          _viewerMap.addLayer(graphicsLayer);

          console.log(graphicsLayer);
        },

        // *************************************************************
        // * CREACION DEL TOOLBAR DE DIBUJO

        _createToolbarCtg: function(){
            tb = new Draw(_viewerMap);
            tb.on("draw-end", self._addToMapCtg);
        },

        _activateToolCtg: function(evt){
            _viewerMap.graphics.clear();
            var tool = evt.target.id.toUpperCase();
            self._changeColorToolbarCtg(tool.toLowerCase())
            if (tool != "ERASE"){
                tb.activate(Draw[tool]);
                _viewerMap.setInfoWindowOnClick(false);
            }else{
                console.log("Delete fetures")
            }
        },

        _addToMapCtg: function(evt){
          var symbolCtg;
          var area = 0;
          tb.deactivate();
          _viewerMap.setInfoWindowOnClick(true);
          switch (evt.geometry.type){
              case "point":
                  symbolCtg = new SimpleMarkerSymbol();
                  self.shapetype = "esriGeometryPoint";
                  break;
              case "polyline":
                  symbolCtg = new SimpleLineSymbol();
                  self.shapetype = "esriGeometryPolyline";
                  break;
              case "polygon":
                  symbolCtg = new SimpleFillSymbol();
                  self.shapetype = "esriGeometryPolygon";
                  break;
              case "erase":
                  self._removeLayersCtg();
                  symbolCtg = null
              }
          var graphic = new Graphic(evt.geometry, symbolCtg);
          _viewerMap.graphics.add(graphic);

          inputGeom = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
          self.geometryEvtCtg = evt.geometry;

          if (evt.geometry.type == "polygon"){
              console.log(evt.geometry);
              self.areaCtg = geometryEngine.geodesicArea(geometryEngine.simplify(graphic.geometry), "hectares");
              console.log(self.areaCtg);
          }
          self.geomCtg = inputGeom.replace(/'/g, '"');
        },

        _removeLayersCtg: function(){
          _viewerMap.graphics.clear();
          _viewerMap.getLayer(glid).clear();

          arrayUtils.map(_viewerMap.graphicsLayerIds, lang.hitch(function(glid){
             var lyr = _viewerMap.getLayer(glid);
             if(lyr instanceof FeatureLayer){
               lyr.clearSelection();
             } else {
               _viewerMap.getLayer(glid).clear();
             }
          }));
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Obtener variable de consulta
        _getSelectedOptionCtg: function(idobj){
            var res = dojo.byId(idobj);
            var selected = res.options[res.selectedIndex].value;
            return selected;
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        _executeProcessCtg: function(){
          console.log("_executeProcessCtg");
          var sql;

          var itemsFields = dom.byId("itemsFieldsCtg").value;
          var nameSearch = dom.byId("searchValueCtg").value;
          if(nameSearch.length>0 & itemsFields.length>0){
            sql = "UPPER(" + itemsFields + ") LIKE UPPER('%" + nameSearch + "%')";
          }else{
            sql = "";
          }

          var geometry;
          if(self.graphicBufferCtg){
            geometry = self.graphicBufferCtg;
          }else if(self.geomCtg){
            geometry = self.geomCtg;
          }

          if (self.areaCtg) {
            if (self.areaCtg <= 100000) {
                self._gprunCtg(geometry, self.codeCtg, sql);
                delete self.graphicBufferCtg;
            }else{
                alert("El grafico realizado supera el valor de area permitido");
            }
          }else{
            if (sql!="") {
              self._gprunCtg(geometry, self.codeCtg, sql);
            }
          }
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Crear Buffer

        _activateBufferCtg: function(){
          if(dojo.byId("actBuffCtg").checked){
            self._activeContainersCtg("bufferCtg", true);
          }else{
            self._activeContainersCtg("bufferCtg", false);
          }
        },

        _makeBufferCtg: function(){
          var params = new BufferParameters();
          params.distances = [ dom.byId("bufferLength").value ];
          params.outSpatialReference = _viewerMap.spatialReference;
          params.unit = GeometryService[dom.byId("unitCtg").value];
          normalizeUtils.normalizeCentralMeridian([self.geometryEvtCtg]).then(function(normalizedGeometries){
            var normalizedGeometry = normalizedGeometries[0];
            if (normalizedGeometry.type === "polygon"){
              esriConfig.defaults.geometryService.simplify([normalizedGeometry], function(geometries){
                params.geometries = geometries;
                esriConfig.defaults.geometryService.buffer(params, self._showBufferCtg);
              });
            } else {
              params.geometries = [normalizedGeometry];
              esriConfig.defaults.geometryService.buffer(params, self._showBufferCtg);
            }
          });
        },

        _showBufferCtg: function(bufferedGeometries){
          var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([255,0,0,0.65]), 2
            ),
            new Color([255,0,0,0.35])
          );
          arrayUtils.forEach(bufferedGeometries, function(geometry) {
            console.log("bufferCtg");  
            var graphic = new Graphic(geometry, symbol);
            var inputGeomBuffer = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
            var GeomBuffer = inputGeomBuffer.replace(/'/g, '"');
            self.graphicBufferCtg = GeomBuffer;
            _viewerMap.graphics.add(graphic);
            self.areaCtg = geometryEngine.geodesicArea(geometryEngine.simplify(graphic.geometry), "hectares");
          });
        },


        //----------------------------------------------------------------------------------
        // Cargar informacion local || shapefile en .zip
        // SE OBTIENE LA URL DE LA ORGANIZACION
        startupAddShpCtg: function(){
          json = this.config.addShapefile;
          esriConfig.defaults.io.proxyUrl = "/proxy/";
        },

        _getBaseFileNameCtg: function(fileName) {
            var baseFileName = fileName.replace(/\\/g, '/');
            baseFileName = baseFileName.substr(baseFileName.lastIndexOf('/') + 1);
            baseFileName = baseFileName.replace(".zip", "");
            return baseFileName;
        },

        _getFileInfoCtg: function(){
          var info = {
            ok: false,
            fileName: null,
            fileType: "shapefile"
          };
          var fileobj = self.fileInputCtg;
          info.filename = fileobj.value;
          if (self._endsWithCtg(info.filename, ".zip")){
            info.ok = true;
          }
          if(info.ok){
            info.baseFileName = self._getBaseFileNameCtg(info.filename);
          }else{
            self._errorHandlerCtg();
          }
          return info;
        },

        _onUploadCtg: function(){
          var fileInfo = self._getFileInfoCtg();
          if (fileInfo.ok){
            _viewerMap.graphics.clear();
            self._generateFeatureCtg(fileInfo.filename);
          };
        },


        _endsWithCtg: function(sv, sfx){
          return (sv.indexOf(sfx, (sv.length - sfx.length)) !== -1);
        },

        _generateFeatureCtg: function(fileName){
          var name = fileName.split(".");
          name = name[0].replace("c:\\fakepath\\", "");
          dom.byId('upload-statusCtg').innerHTML = '<b>Loading </b>' + name;

          var params = {
              'name': name,
              'targetSR': _viewerMap.spatialReference,
              'maxRecordCount': 1000,
              'enforceInputFileSizeLimit': true,
              'enforceOutputJsonSizeLimit': true
          };

          var extent = scaleUtils.getExtentForScale(_viewerMap, 40000);
          var resolution = extent.getWidth() / _viewerMap.width;
          params.generalize = true;
          params.maxAllowableOffset = resolution;
          params.reducePrecision = true;
          params.numberOfDigitsAfterDecimal = 0;

          var myContent = {
              'filetype': self._getFileInfoCtg().fileType,
              'publishParameters': JSON.stringify(params),
              'f': 'json',
              'callback.html': 'textarea'
          };

          esriRequest({
            url: portalUrl + '/sharing/rest/content/features/generate',
            content: myContent,
            form: dom.byId('uploadFormCtg'),
            handleAs: 'json',
            load: lang.hitch(this, function (response) {
                 if (response.error) {
                    self._errorHandlerCtg(response.error);
                    return;
                }
                var layerName = response.featureCollection.layers[0].layerDefinition.name;
                dom.byId('upload-statusCtg').innerHTML = '<b>Cargado: </b>' + layerName;
                self._addShapefileToMapCtg(response.featureCollection);
            }),
            error: lang.hitch(this, self._errorHandlerCtg)
          });
        },

        _addShapefileToMapCtg: function(featureCollection){
          var fullExtent;
          var layers = [];
          arrayUtils.forEach(featureCollection.layers, function (layer) {
              var infoTemplate = new InfoTemplate("Details", "${*}");
              var featureLayer = new FeatureLayer(layer, {
                  infoTemplate: infoTemplate
              });
              featureLayer.on('click', function (event) {
                  _viewerMap.infoWindow.setFeatures([event.graphic]);
              });
              self._changeRendererCtg(featureLayer);
              fullExtent = fullExtent ?
                fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
              layers.push(featureLayer);
          });
          var geom = featureCollection.layers[0].featureSet.features[0].geometry;
          self.geometryEvtCtg = geom;
          var graphic = new Graphic(geom);
          inputGeom = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
          self.areaCtg = geometryEngine.geodesicArea(geometryEngine.simplify(graphic.geometry), "hectares");
          console.log(self.areaCtg);
          self.geomCtg = inputGeom.replace(/'/g, '"');

          _viewerMap.addLayers(layers);
          _viewerMap.setExtent(fullExtent.expand(1.25), true);
          dom.byId('upload-statusCtg').innerHTML = "";
        },

        _changeRendererCtg: function(layer){
          var symbol = null;
          switch (layer.geometryType) {
              case 'esriGeometryPoint':
                  symbol = new PictureMarkerSymbol({
                      'angle': 0,
                      'xoffset': 0,
                      'yoffset': 0,
                      'type': 'esriPMS',
                      'url': 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                      'contentType': 'image/png',
                      'width': 20,
                      'height': 20
                  });
                  break;
              case 'esriGeometryPolygon':
                  symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                      new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                  break;
          }
          if (symbol) {
              layer.setRenderer(new SimpleRenderer(symbol));
          }
        },


        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Ejecutar geoproceso
        _gprunCtg: function(inputjson, queryentity, sql){
            self._activeContainersCtg("loaderCtg", true);
            self._activeContainersCtg("errorCtg", false);
            // Se crea el objeto de la clase Geoprocesor
            // Se le agrega el parametro de la url del servicio
            gp = new Geoprocessor(self.config.serviceUrl);
            console.log(gp);
            // Se establecen los parametros del geoproceso
            var params = {'input_jsonService': inputjson, 'input_queryEntity': queryentity, 'input_query': sql};
            // se ejecuta el geoproceso
            gp.submitJob(params, self._completeCallbackCtg, self._statusCallbackCtg);
        },

        // Obtener los mensajes durante la ejecucion del proceso
        _statusCallbackCtg: function(JobInfo){
            console.log(JobInfo.jobStatus);
        },

        // Funcion a ejecutar cuando el proceso finaliza
        _completeCallbackCtg: function(JobInfo){
            // Si el proceso obtiene un error
            if(JobInfo.jobStatus=="esriJobFailed"){
                // Se activa el icono de error
                self._activeContainersCtg("errorCtg", true);
                self._activeContainersCtg("loaderCtg", false)
            }else{
                gp.getResultData(JobInfo.jobId, "output_exportShp", self._showFieldValuesCtg);
                gp.getResultData(JobInfo.jobId, "output_exportZip", self._downloadZipCtg);
                gp.getResultData(JobInfo.jobId, "output_exporJson", self._extentProcessCtg);
                // Se activa el boton de descarga
                self._activeContainersCtg("loaderCtg", false);
                self._activeContainersCtg("resultCtg", true);
            }
        },


        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Muestra resultados

        // Se agrega la ruta de desacarga
        _downloadZipCtg: function(outputFile){
           // Se obtiene la url del resultado del geoproceso
           var url = outputFile.value.url;
           // Se agrega la url a la etiqueta html <a>
           domAttr.set(dojo.byId("downloadzipCtg"), 'href', url);
        },

        _setExtentCtg: function(ext){
          _viewerMap.setExtent(ext, true);
        },

        _zoomExtentCtg: function(evt){
            self._setExtentCtg(self.extCtg);
        },

        _extentProcessCtg: function(extent){
            console.log(extent);
            var ext_tmp = extent.value.replace(/u/g, '');
            ext_tmp = ext_tmp.replace(/'/g, "\"");
            self.extCtg = new esri.geometry.Extent(JSON.parse(ext_tmp));
            self._setExtentCtg(self.extCtg);
            on(dojo.byId("extentgeometryCtg"), "click", self._zoomExtentCtg);
        },


        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Muestra el error del lado del cliente
        _errorHandlerCtg: function(error) {
          dom.byId('upload-statusCtg').innerHTML =
          "<p style='color:red'>" + error.message + "</p>";
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Activar o descativar contenedores
        _activeContainersCtg: function(onid, value){
            if(value){
                // Agrega una subclase a un elemento
                domClass.add(onid, "active");
            }else {
                // Remueve una subclase de un elemento
                domClass.remove(onid, "active")
            }
        },
      });
    });
