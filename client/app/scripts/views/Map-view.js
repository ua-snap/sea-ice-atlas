/*global client, Backbone, JST, OpenLayers */
'use strict';

client.Views.MapView = Backbone.View.extend({

	template: JST['app/scripts/templates/Map.ejs'],
	render: function() {
		var geographic = new OpenLayers.Projection("EPSG:4326");

		var map = new OpenLayers.Map('map', {
			projection: geographic,
			allOverlays: true
		});

		var olWms = new OpenLayers.Layer.WMS(
			'OpenLayers WMS',
			'http://vmap0.tiles.osgeo.org/wms/vmap0',
			{
				layers: 'basic'
			}
		);
/*
		This needs to be fiddled with in order to correctly reference the tile's spatial position.

		var seaXYZ = new OpenLayers.Layer.XYZ(
			'Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/tilecache/tilecache.cgi/1.0.0/seaice_atlas_test/${z}/${y}/${x}'
		);
*/

		var cacheWms = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/tilecache/tilecache.cgi',
			{
				layers: 'seaice_atlas_test',
				transparent: 'true',
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);

		map.addLayers([olWms, cacheWms]);
		map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.zoomToMaxExtent();
	}

});
