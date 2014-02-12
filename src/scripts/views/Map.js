/*global client, Backbone, JST, OpenLayers, proj4, moment, _, Q */
'use strict';

client.Views.MapView = Backbone.View.extend({
	proj3857: '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	proj4326: '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',

	initialize: function() {
		// When the layer changes, update the map
		_.bindAll(this, 'setCurrentLayer','renderBaseLayer','loadLayer', 'render', 'coordinateClicked');
	},

	layer: {}, // will be populated with buffering

	// True means don't re-render the basemap object
	hasRendered: false,

	template: JST['app/scripts/templates/Map.ejs'],	

	// Will contain a promise which, when fulfilled, means the base layer has been loaded.
	baseLayerLoadPromise: null,

	setCurrentLayer: function(year, month) {
		this.currentLayer = year + '_' + month;
	},

	renderBaseLayer: function() {
		this.baseLayerLoadPromise = Q.defer();

		this.map = new OpenLayers.Map({
			div: 'map',
			allOverlays: true,
			zoomMethod: null,
			controls: [],
			projection: new OpenLayers.Projection('EPSG:3857'),
		     	sphericalMercator: true,
     			maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34)
		});

		// Prevent scroll wheel from zooming
		_.each( this.map.getControlsByClass('OpenLayers.Control.Navigation'), function(e) {
			e.disableZoomWheel();
		});

		var gmap = new OpenLayers.Layer.Google("Google Terrain", {
			visibility: true,
			isBaseLayer: true
		});
		
		this.map.addLayers([gmap]);
		this.map.layers[0].isBaseLayer = true;

		google.maps.event.addListener(gmap.mapObject, 'tilesloaded', _.bind(function() {
			this.baseLayerLoadPromise.resolve();
		}, this));

		this.map.setCenter( new OpenLayers.LonLat(-153, 65).transform('EPSG:4326', 'EPSG:3857'), 4);
		this.createClickHandler();
		this.hasRendered = true;
		
		this.markers = new OpenLayers.Layer.Markers("Markers");

		return this.baseLayerLoadPromise.promise;
	},

	render: function() {
		if( false === this.hasRendered ) {
			return this.renderBaseLayer();
		}
	},

	loadLayer: function() {
		var layerLoadedPromise = Q.defer();

		var oldLayer = this.currentLayer;
		var layerName = this.model.get('year') + '_' + this.model.get('month');
		this.layer[layerName] = new OpenLayers.Layer.WMS(
			layerName,
			'http://tiles.snap.uaf.edu/tilecache/tilecache.py/2.11.0/',
			{
				projection: 'EPSG:3857',
				layers: _.template(client.config.mapLayerNameTemplate, this.model.toJSON()),
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);

		this.map.addLayers([this.layer[layerName]]);
		this.layer[layerName].events.register('loadend', this, function displayLoadedLayer(layer) {

			layerLoadedPromise.resolve();

			if( 
				false === _.isUndefined(oldLayer)
				&& false === _.isUndefined(this.layer[oldLayer])
				&& false === (layerName === oldLayer)
			) {
				this.layer[oldLayer].destroy();
			}
			this.markers.setZIndex(1000);

			$('#mapTitle').text('Historical sea ice concentration, ' + moment(_.template('<%= year %>-<%= month %>', this.model.toJSON()), 'YYYY-MM').format('MMMM YYYY'));

		});
		this.setCurrentLayer(this.model.get('year'), this.model.get('month'));

		return layerLoadedPromise.promise;
	},

	createClickHandler: function() {
		OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
			coordinateClicked: this.coordinateClicked,

			defaultHandlerOptions: {
				'single': true,
				'double': false,
				'pixelTolerance': 0,
				'stopSingle': false,
				'stopDouble': false
			},

			initialize: function(options) {
				this.handlerOptions = OpenLayers.Util.extend(
					{}, this.defaultHandlerOptions
				);

				OpenLayers.Control.prototype.initialize.apply(
					this, arguments
				);

				this.handler = new OpenLayers.Handler.Click(
					this, {
						'click': this.coordinateClicked
					}, this.handlerOptions
				);
			},
		});
		
		this.click = new OpenLayers.Control.Click();
		this.map.addControl(this.click);

		if(true === _.isUndefined(this.markers)) {
			this.markers = new OpenLayers.Layer.Markers("Markers");
	                	this.click.activate();
		}

	},

	activateClickHandler: function() {
		if(true === _.isUndefined(this.click)) {
			this.createClickHandler();
		}
		
		this.map.controls[0].activate();
	},
	
	deactivateClickHandler: function() {
		this.markers.clearMarkers();
	        	this.map.controls[0].deactivate();
	},
	
	coordinateClicked: _.debounce(function(e) {		
		var lonlat = this.map.getLonLatFromPixel(e.xy);
		var reprojected = proj4(this.proj3857, this.proj4326, [lonlat.lon, lonlat.lat]);

		this.model.set({
			'lon' : this.roundCoord(reprojected[0]),
			'lat' : this.roundCoord(reprojected[1])
		});
	}, 500),

	drawMarker: function() {
		var reprojected = proj4(this.proj4326, this.proj3857, [this.model.get('lon'), this.model.get('lat')]);
		var lonlat = new OpenLayers.LonLat(reprojected[0], reprojected[1]);
		this.markers.clearMarkers();
		this.map.addLayer(this.markers);
		var size = new OpenLayers.Size(21,25);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', new OpenLayers.Size(21, 25), offset);
		this.markers.addMarker(new OpenLayers.Marker(lonlat, icon));
		this.markers.setZIndex(500);
	},

	roundCoord: function(coord) {
 		return (Math.round(coord * 4) / 4).toFixed(2);
   	}
});
