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

		var seaWms = new OpenLayers.Layer.XYZ(
			'Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/tilecache/tilecache.cgi/1.0.0/sic_mean_pct_weekly_ak_12_23_2012/${z}/${y}/${x}'
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
