/*global client, Backbone, JST, OpenLayers */
'use strict';

client.Views.MapView = Backbone.View.extend({

	template: JST['app/scripts/templates/Map.ejs'],
	render: function() {
		var map = new OpenLayers.Map({
			div: 'map',
			allOverlays: true
		});

		var olWms = new OpenLayers.Layer.WMS(
			'OpenLayers WMS',
			'http://vmap0.tiles.osgeo.org/wms/vmap0',
			{layers: 'basic'}
			);

		var seaWms = new OpenLayers.Layer.WMS(
			'Sea WMS',
			'http://hades.snap.uaf.edu/cgi-bin/mapserv?map=/var/www/html/seaiceatlas2.map&SERVICE=WMS&VERSION=1.1.1%20&REQUEST=GetMap&LAYERS=seaiceatlas&STYLES=&SRS=EPSG:4326&WIDTH=700&HEIGHT=644&BBOX=179.875,40.125,240.125,80.375&FORMAT=image/png',
			{},
			{singleTile: true}
		);

		var dmWms = new OpenLayers.Layer.WMS(
			'Canadian Data',
			'http://www2.dmsolutions.ca/cgi-bin/mswms_gmap',
			{
				layers: 'bathymetry,land_fn,park,drain_fn,drainage,' +
				'prov_bound,fedlimit,rail,road,popplace',
				transparent: 'true',
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: false
			}
		);

		map.addLayers([olWms, seaWms, dmWms]);
		map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.zoomToMaxExtent();
	}

});
