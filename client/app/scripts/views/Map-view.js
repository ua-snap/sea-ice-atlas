/*global client, Backbone, JST, OpenLayers, proj4 */
'use strict';

client.Views.MapView = Backbone.View.extend({

	template: JST['app/scripts/templates/Map.ejs'],
	render: function() {

		var destProj = new OpenLayers.Projection('EPSG:3338');
		var sourceProj = new OpenLayers.Projection('EPSG:4326');
		
		var extent = new OpenLayers.Bounds(-9036842.762,-9036842.762, 9036842.762, 9036842.762);

		var map = new OpenLayers.Map('map',{
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

		var cacheWms = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/cgi-bin/mapserv?map=/var/www/html/bruce-seaiceatlas.map',
			{
				layers: 'seaiceatlas',
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);
		map.addLayers([ginaLayer, cacheWms]);
		map.setCenter( new OpenLayers.LonLat(118829.786, 1310484.872).transform(map.displayProjection, map.projection),4);
	}

});
