/*global client, Backbone, JST, OpenLayers, proj4, moment, _, Q */
'use strict';

client.Views.MapView = Backbone.View.extend({
	initialize: function() {
		// When the layer changes, update the map
		this.model.on('change', _.debounce(this.render, 1000), this);
		_.bindAll(this);
	},
	layer: {}, // will be populated with buffering
	hasRendered: false,

	// Will contain a promise which, when fulfilled, means the base layer has been loaded.
	baseLayerLoadPromise: null,

	setCurrentLayer: function(year, month) {
		this.currentLayer = year + '_' + month;
	},

	renderBaseLayer: function() {
		this.baseLayerLoadPromise = Q.defer();

		var destProj = new OpenLayers.Projection('EPSG:3338');
		var extent = new OpenLayers.Bounds(-9036842.762,-9036842.762, 9036842.762, 9036842.762);

		this.map = new OpenLayers.Map('map',{
			maxExtent:extent,
			resolutions: [70600.334078125001, 35300.1670390625, 17650.08351953125, 8825.0417597656251, 4412.5208798828126, 2206.2604399414063, 1103.1302199707031, 551.56510998535157, 275.78255499267578, 137.89127749633789, 68.945638748168946, 34.472819374084473, 17.236409687042237, 8.6182048435211183, 4.3091024217605591, 2.1545512108802796, 1.0772756054401398, 0.53863780272006989, 0.26931890136003495, 0.13465945068001747],
			units:'m',
			wrapDateLine:false,
			projection:destProj,
			displayProjection:destProj
		});

		var ginaLayer = new OpenLayers.Layer.WMS(
			'GINA WMS',//layer label
			'http://wms.alaskamapped.org/bdl/',
			{
				layers: 'BestDataAvailableLayer' //layer wms name
			},
			{
				animationEnabled:true,
				isBaseLayer:true,
				transitionEffect: 'resize',
				attribution: 'Best Data Layer provided by <a href="http://www.gina.alaska.edu">GINA</a>'
			}
		);
		ginaLayer.events.register('loadend', this, function(layer) {
			this.baseLayerLoadPromise.resolve();
		});

		this.map.addLayers([ginaLayer]);
		this.map.setCenter( new OpenLayers.LonLat(118829.786, 1510484.872).transform(this.map.displayProjection, this.map.projection),3);
		this.hasRendered = true;
		
		return this.baseLayerLoadPromise.promise;
	},

	render: function() {
		if( false === this.hasRendered ) {
			return this.renderBaseLayer();
		}
	},

	showLayer: function() {
		$('#mapTitle').text('Historical Sea Ice Concentration, ' + moment(_.template('<%= year %>-<%= month %>', this.model.toJSON()), 'YYYY-MM').format('MMMM YYYY'));
		this.map.addLayers([this.layer[this.currentLayer]]);
	},

	loadLayer: function(year, month) {
		/* Deprecated, need to reintegrate this. 
		this.layer[year+'_'+month] = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://icarus.snap.uaf.edu/cgi-bin/mapserv.cgi?map=/var/www/mapserver/sea.map',
			{
				layers: 'seaiceatlas',
				transparent: true,
				date: _.template('<%= year %>_<%= month %>', {year:year, month:month}),
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);
		*/
	}
});
