/*global client, Backbone, JST, OpenLayers, proj4, moment, _ */
'use strict';

client.Views.MapView = Backbone.View.extend({
	initialize: function() {
		// When the layer changes, update the map
		this.model.on('change', _.debounce(this.render, 1000), this);
		_.bindAll(this);
	},
	layer: {}, // will be populated with buffering
	hasRendered: false,

	setCurrentLayer: function(year, month) {
		this.currentLayer = year + '_' + month;
	},

	renderBaseLayer: function() {
		var destProj = new OpenLayers.Projection('EPSG:3338');
		//var sourceProj = new OpenLayers.Projection('EPSG:4326');
		
		var extent = new OpenLayers.Bounds(-9036842.762,-9036842.762, 9036842.762, 9036842.762);
		//var extent = new OpenLayers.Bounds(-2255938.4795, 449981.1884, 1646517.6368, 2676986.5642);

		this.map = new OpenLayers.Map('map',{
			maxExtent:extent,
			//restrictedExtent:extent,
			resolutions: [70600.334078125001, 35300.1670390625, 17650.08351953125, 8825.0417597656251, 4412.5208798828126, 2206.2604399414063, 1103.1302199707031, 551.56510998535157, 275.78255499267578, 137.89127749633789, 68.945638748168946, 34.472819374084473, 17.236409687042237, 8.6182048435211183, 4.3091024217605591, 2.1545512108802796, 1.0772756054401398, 0.53863780272006989, 0.26931890136003495, 0.13465945068001747],
			units:'m',
			wrapDateLine:false,
			projection:destProj,
			displayProjection:destProj,
			extent_type: 'loose'
		});

/*
		var ginaLayer = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/tilecache/tilecache.cgi/2.11.0/',
			{
				layers: 'seaice_conc_sic_mean_pct_weekly_ak_1953_01_average',
				transparent: true,
				format: 'image/png'
			},
			{
				animationEnabled: true,
				transitionEffect: 'resize',
				isBaseLayer: true
			}
		);
*/

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


		this.map.addLayers([ginaLayer]);
		this.map.setCenter( new OpenLayers.LonLat(118829.786, 1510484.872).transform(this.map.displayProjection, this.map.projection),4);
		this.hasRendered = true;
				console.log(this.map.getResolution());

	},

	render: function() {
		if( false === this.hasRendered ) {
			this.renderBaseLayer();
		}
		this.oldLayer = this.currentLayer;
		
		this.setCurrentLayer(this.model.get('year'), this.model.get('month'));
		this.loadLayer(this.model.get('year'), this.model.get('month'));
/*
		var counter = setInterval(_.bind(function loadPreviousMonth() {
			
			var month = moment(this.currentLayer, 'YYYY_MM').subtract('months', 1);
			var monthString = month.month() + 1;
			if (monthString <= 9) {
				monthString = '0'+monthString;
			}
			this.model.set( {
				month: monthString, // moment months are zero-indexed
				year: month.year()
			});
			
		}, this), 1000);
*/

	},

	showLayer: function() {
		$('#mapTitle').text('Historical Sea Ice Concentration, ' + moment(_.template('<%= year %>-<%= month %>', this.model.toJSON()), 'YYYY-MM').format('MMMM YYYY'));
		this.map.addLayers([this.layer[this.currentLayer]]);
	},

	loadLayer: function(year, month) {
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
	}
});
