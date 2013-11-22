/*global client, Backbone, JST, OpenLayers, proj4, moment, _, Q */
'use strict';

client.Views.MapView = Backbone.View.extend({
	initialize: function() {

		// When the layer changes, update the map
		_.bindAll(this, 'setCurrentLayer','renderBaseLayer','loadLayer', 'render', 'coordinateClicked');

		this.destProj = new OpenLayers.Projection('EPSG:3338');
		this.sourceProj = new OpenLayers.Projection('EPSG:4326');
		this.mapProj = new OpenLayers.Projection('EPSG:3857');
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
			controls: [],
			allOverlays: true,
			projection: this.mapProj,
			resolutions: [70600.334078125001, 35300.1670390625, 17650.08351953125, 8825.0417597656251, 4412.5208798828126, 2206.2604399414063, 1103.1302199707031, 551.56510998535157, 275.78255499267578, 137.89127749633789, 68.945638748168946, 34.472819374084473, 17.236409687042237, 8.6182048435211183, 4.3091024217605591, 2.1545512108802796, 1.0772756054401398, 0.53863780272006989, 0.26931890136003495, 0.13465945068001747]
		});

		var gmap = new OpenLayers.Layer.Google("Google Terrain", {visibility: true});

		// note that first layer must be visible
		this.map.addLayers([gmap]);		
		this.map.setCenter( new OpenLayers.LonLat(-16828376.147264, 9307322.121985), 4);
		this.createClickHandler();
		this.hasRendered = true;
		
		this.markers = new OpenLayers.Layer.Markers("Markers");

		var click = new OpenLayers.Control.Click();
                this.map.addControl(click);
                click.activate();

		this.baseLayerLoadPromise.resolve();
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
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/cgi-bin/mapserv?map=/var/www/html/g-hsia.map',
			{
				projection: 'EPSG:3857',
				layers: _.template('seaice_conc_sic_mean_pct_weekly_ak_<%= year %>_<%= month %>_average', this.model.toJSON()),
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);

		this.map.addLayers([this.layer[layerName]]);
		this.layer[layerName].setOpacity(0);
		this.layer[layerName].events.register('loadend', this, function(layer) {
			
			layerLoadedPromise.resolve();
			this.layer[layerName].setOpacity(1);

			if( 
				false === _.isUndefined(oldLayer)
				&& false === _.isUndefined(this.layer[oldLayer])
			) {
				this.map.removeLayer(this.layer[oldLayer]);
			}
	
			$('#mapTitle').text('Historical Sea Ice Concentration, ' + moment(_.template('<%= year %>-<%= month %>', this.model.toJSON()), 'YYYY-MM').format('MMMM YYYY'));

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
	},

	activateClickHandler: function() {
        	this.map.controls[1].activate();
	},
	
	deactivateClickHandler: function() {
        	this.map.controls[1].deactivate();
	},
	
	coordinateClicked: _.debounce(function(e) {		
		var lonlat = this.map.getLonLatFromPixel(e.xy);
		var to = '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
		var from = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
		var reprojected = proj4(to, from, [lonlat.lon, lonlat.lat]);
		this.markers.clearMarkers();
		this.map.addLayer(this.markers);
		var size = new OpenLayers.Size(21,25);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', new OpenLayers.Size(21, 25), offset);
		this.markers.addMarker(new OpenLayers.Marker(lonlat, icon));

		this.model.set({
			'lon' : reprojected[0],
			'lat' : reprojected[1]
		});
	}, 500)
});
