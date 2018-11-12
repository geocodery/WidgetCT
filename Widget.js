define([
        "dojo/_base/declare",
        "jimu/BaseWidget",
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
        "dojo/fx/Toggler",
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
        "esri/tasks/GeometryService",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/toolbars/draw",
        "dojo/domReady!"
      ], function ( declare,
                    BaseWidget,
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
                    Toggler,
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

        
        baseClass: 'ConsultaTematica',  // Clase principal para CSS
        postCreate: function() {        // Ejecuta despues de crearse
          this.inherited(arguments);
          self = this;
          console.log('ConsultaTematica::postCreate');
        },

        // Ejecuta al abrir widget
        startup: function () {
            this.inherited(arguments);  
            self._createToolbarCtg();
            self._searchService();
            self = this;
            self._ValuesfromField();
            console.log('ConsultaTematica::startup');
        },

        // Configuracion de ventana de trabajo
        onOpen: function(){
          console.log('ConsultaTematica::onOpen');
          var panel = this.getPanel();
          panel.position.height = 700;
          panel.setPosition(panel.position);
          panel.panelManager.normalizePanel(panel);
        },

        // Configuracion del cambio entre pestañas
        _onchangetab: function(evt){
            var currentid = evt.target.id;
            self._activeclass("method", currentid);
            if (currentid == "selectbtnCtg"){
                self._activeclass("tabcontentCtg", "selectCtg");
              }
            if (currentid == "drawbtnCtg"){
                self._activeclass("tabcontentCtg", "drawCtg")
              }
            if(currentid == "resbtnCtg"){
                self._activeclass("tabcontentCtg", "resultCtg")
                tb.deactivate();
              }
        },

        // Activa y desactiva clases
        _activeclass: function(offclass, onid){
            var tab = query("." + offclass);
            for(i = 0; i < tab.length; i++){
                domClass.remove(tab[i].id, "active");
            }
            domClass.add(onid, "active");
        },

        // Cambia el color de las herramientas de dibujo
        _changeColorToolbar: function(onid){
            var array = ['point', 'polyline', 'polygon'];
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
        _selectUrlService: function(code){
          var url="http://geocatmin.ingemmet.gob.pe/arcgis/rest/services/SERV_GEOLOGIA_INTEGRADA_v2/MapServer/";
          url=url.concat(code);
          return url;
        },

        // Busca y llama al servicio buscado
        _searchService: function(){
          on(dom.byId("queryentity"), "change", function () {
            var urlService = self._selectUrlService(dom.byId("queryentity").value);
            var requestHandle = esriRequest({
              "url": urlService,
              "content": {
                "f": "json" 
              },
              "callbackParamName": "callback"
            });
            requestHandle.then(self._requestSucceeded, self._errorHandler);
          });
        },

        // Agrega los campos recogidos del servicio
        _requestSucceeded: function(response, io){
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
          var comboField = registry.byId("itemsFields");
          if(comboField) {
              comboField.store = FieldNames;
          }else {
              comboField = new ComboBox({
                  id: "itemsFields",
                  store: FieldNames,
                  searchAttr: "Field"},
                  "itemsFields"
                  );
                };
        },

        // Funcionalidad de hacer query al campo seleccionado considerando un parámetro
        _ValuesfromField :function(){
          var query = new Query();
          on(dom.byId("searchDesc"), "click", function(evt){
            var urlService = self._selectUrlService(dom.byId("queryentity").value);
            var queryTask = new QueryTask(urlService);
            var layer = new FeatureLayer(urlService, {
                  mode: FeatureLayer.MODE_ONDEMAND,
                  outFields: ["*"],
              opacity: 0.9,
              visible: true
            });
            var nameSearch = dom.byId("searchValue").value;
            query.text = dom.byId("itemsFields").value;
            query.outFields =  ["*"];
            query.where = "UPPER(" + query.text + ") LIKE UPPER('%" + nameSearch + "%')";
            query.returnGeometry = true;
            query.outSpatialReference = {wkid:102100};
            console.log(query);
            queryTask.execute(query).then(self._showFieldValues, self._errorHandler);
          });
        },

        //Muestra los resultados encontrados
        _showFieldValues: function(results) {
          self._activeContainers("info", true);
          var resultItems = [];
          var resultCount = results.features.length;
          var FieldValues = [];
          var inputGeom = JSON.stringify(results).replace(/['"]+/g, '\'');
          console.log(inputGeom);
          for(i = 0; i < results.features.length; i++){
            var geomType = results.geometryType;
          }

          for (var i = 0; i < resultCount; i++) {
            var featureAttributes = results.features[i].attributes;
            for (var attr in featureAttributes) {
              if(attr == dom.byId("itemsFields").value){
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
          dom.byId("info").innerHTML = showValues.join("");

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
            self._changeColorToolbar(tool.toLowerCase())
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
                  symbolCtg = null
              }
          var graphic = new Graphic(evt.geometry, symbolCtg);
          _viewerMap.graphics.add(graphic);

          var inputGeom = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
          console.log(inputGeom);

          if (evt.geometry.type == "polygon"){
              area = geometryEngine.geodesicArea(geometryEngine.simplify(graphic.geometry), "square-kilometers");
              console.log(area);
          }
          var inputGeom = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
          self._activateBuffer(inputGeom, evt.geometry);
        },



        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Crear Buffer
        _activateBuffer: function(grafico, geometry){
          var toggler = new Toggler({
            node: "buffer"
          });
          if(!this.activateBuffer.checked){
            toggler.hide();
          }else{
            toggler.show();
            self._makeBuffer(grafico, geometry);
          }
        },
        
        _makeBuffer: function(graphic, geometry){
          var params = new BufferParameters();
          params.distances = [ dom.byId("bufferLength").value ];
          params.outSpatialReference = _viewerMap.spatialReference;
          params.unit = GeometryService[dom.byId("unit").value];

          normalizeUtils.normalizeCentralMeridian([geometry]).then(function(normalizedGeometries){
            var normalizedGeometry = normalizedGeometries[0];
            if (normalizedGeometry.type === "polygon"){
              esriConfig.defaults.geometryService.simplify([normalizedGeometry], function(geometries){
                params.geometries = geometries;
                esriConfig.defaults.geometryService.buffer(params, self._showBuffer);
              });
            } else {
              params.geometries = [normalizedGeometry];
              esriConfig.defaults.geometryService.buffer(params, self._showBuffer);
            }
          });
        },

        _showBuffer: function(bufferedGeometries){
          var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([255,0,0,0.65]), 2
            ),
            new Color([255,0,0,0.35])
          );
          arrayUtils.forEach(bufferedGeometries, function(geometry) {
            console.log("buffer");  
            var graphic = new Graphic(geometry, symbol);
            var inputGeomBuffer = JSON.stringify(graphic.geometry).replace(/['"]+/g, '\'');
            console.log(inputGeomBuffer);
            _viewerMap.graphics.add(graphic);
          });
        },

        // *************************************************************
        // * AGREGAR SHAPEFILE

        // CAMBIAR EL NOMBRE DEL ZIP INPUT, IE: INTERNET EXPLORER | CHROME
        _getBaseFileNameCtg: function(fileName) {
            var baseFileName = fileName.replace(/\\/g, '/');
            baseFileName = baseFileName.substr(baseFileName.lastIndexOf('/') + 1);
            baseFileName = baseFileName.replace(".zip", "");
            return baseFileName;
        },

        // COMPARA SI LA EXTENSION INGRESADA ES LA EXTENSION REQUERIDA POR EL PROCESO
        _endsWithCtg: function(sv, sfx){
          return (sv.indexOf(sfx, (sv.length - sfx.length)) !== -1);
        },

        // OBTENER LA INFORMACION DEL ARCHIVO INGRESADO
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
            self._errorHandler();
          }
          return info;
        },

        // INICIAR LA CARGA DEL .ZIP INPUT
        _onUploadCtg: function(){
          var fileInfo = self._getFileInfoCtg();
          if (fileInfo.ok){
            _viewerMap.graphics.clear();
            self._generateFeatureCollection(fileInfo.baseFileName);
          };
        },

        // ENVIA EL ARCHIVO INGRESADO Y DEVUELVE EL FEATURE EN FORMATO JSON
        _generateFeatureCollection: function(fileName){
          var name = fileName.split(".");
          name = name[0].replace("c:\\fakepath\\", "");
          dom.byId('upload-status').innerHTML = '<b>Loading </b>' + name;

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
                      self._errorHandler(response.error);
                      return;
                  }
                  var layerName = response.featureCollection.layers[0].layerDefinition.name;
                  dom.byId('upload-status').innerHTML = '<b>Cargado: </b>' + layerName;
                  self._addShapefileToMap(response.featureCollection);
              }),
              error: lang.hitch(this, self._errorHandler)
            });
          },

        _addShapefileToMap: function(featureCollection){
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
              self._changeRenderer(featureLayer);
              fullExtent = fullExtent ?
                fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
              layers.push(featureLayer);
          });
          _viewerMap.addLayers(layers);

          console.log(layers);

          _viewerMap.setExtent(fullExtent.expand(1.25), true);
          dom.byId('upload-status').innerHTML = "";
        },

        _changeRenderer: function(layer){
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

        _downloadJSON: function (text) {
          var a = dom.byId("a").value;
          var file = new Blob([text], {type: 'text/plain'});
          a.href = URL.createObjectURL(file);
          a.download = 'json.txt';
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Muestra el error del lado del cliente
        _errorHandler: function(error) {
          dom.byId('upload-status').innerHTML =
          "<p style='color:red'>" + error.message + "</p>";
          console.log("error????");
        },

        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Activar o descativar contenedores
        _activeContainers: function(onid, value){
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


