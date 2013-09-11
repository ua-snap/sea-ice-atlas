/*global client, Backbone, JST, OpenLayers, proj4, moment, _ */
'use strict';

client.Views.MapView = Backbone.View.extend({
	initialize: function() {
		// When the layer changes, update the map
		this.model.on('change', this.render, this);
		_.bindAll(this);
	},
	hasRendered: false,
	render: function() {
		if( false === this.hasRendered ) {
			var destProj = new OpenLayers.Projection('EPSG:3338');
			var sourceProj = new OpenLayers.Projection('EPSG:4326');
			
			var extent = new OpenLayers.Bounds(-9036842.762,-9036842.762, 9036842.762, 9036842.762);

			this.map = new OpenLayers.Map('map',{
				maxExtent:extent,
				restrictedExtent:extent,
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
			this.map.addLayers([ginaLayer]);
			this.hasRendered = true;
		}
		
		if(_.isObject(this.cacheWms)) {
			console.log('removing old layer');
			this.map.removeLayer(this.cacheWms);
		}
		this.cacheWms = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://icarus.snap.uaf.edu/cgi-bin/mapserv.cgi?map=/var/www/mapserver/sea.map',
			{
				layers: 'seaiceatlas',
				transparent: true,
				date: _.template('<%= year %>_<%= month %>', this.model.toJSON()),
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);
		$('#mapTitle').text('Historical Sea Ice Concentration, ' + moment(_.template('<%= year %>-<%= month %>', this.model.toJSON()), 'YYYY-MM').format('MMMM YYYY'));
		this.map.addLayers([this.cacheWms]);
		this.map.setCenter( new OpenLayers.LonLat(118829.786, 1510484.872).transform(this.map.displayProjection, this.map.projection),4);
	}

});
