/*global client, Backbone, JST, OpenLayers, proj4, moment, _, Q */
'use strict';

client.Views.MapAnimatorView = Backbone.View.extend({
	initialize: function() {
		_.bindAll(this);
	},

	// Used for buffering layers for animation
	layers: {},

	// Will contain promises corresponding to the load status of each layer.
	promises: {},
	showLayer: function(layerIndex) {
		$('#mapTitle').text('Historical Sea Ice Concentration, ' + this.model.layers[layerIndex]);
		this.layers[this.model.layers[layerIndex]].setOpacity(1);
	},

	loadLayer: function(layerIndex) {
		this.promises[this.model.layers[layerIndex]] = Q.defer();
		this.layers[this.model.layers[layerIndex]] = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/tilecache/tilecache.cgi/2.11.0/',
			{
				layers: 'seaice_conc_sic_mean_pct_weekly_ak_' + this.model.layers[layerIndex] + '_average',
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true, // Doesn't load unless visibility is true
				layerIndex: layerIndex
			}
		);
		this.layers[this.model.layers[layerIndex]].setOpacity(1); // Hide, but still load
		this.layers[this.model.layers[layerIndex]].events.register('loadend', this, function(layer) {
			this.promises[this.model.layers[layer.object.layerIndex]].resolve(layer);
		});
		this.map.addLayer(this.layers[this.model.layers[layerIndex]]);

		return this.promises[this.model.layers[layerIndex]].promise;
	},

	hideLayer: function(layerIndex) {
		this.layers[this.model.layers[layerIndex]].setOpacity(0); // Hide, but still load
	}
});
