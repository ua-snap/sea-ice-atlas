/*global client, Backbone, JST, OpenLayers */
'use strict';

client.Views.MapView = Backbone.View.extend({

	template: JST['app/scripts/templates/Map.ejs'],
	render: function() {
		var map = new OpenLayers.Map('map');

		var olWms = new OpenLayers.Layer.WMS(
			'OpenLayers WMS',
			'http://vmap0.tiles.osgeo.org/wms/vmap0',
			{layers: 'basic'}
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

		map.addLayers([olWms, dmWms]);
		map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.zoomToMaxExtent();
	}

});
