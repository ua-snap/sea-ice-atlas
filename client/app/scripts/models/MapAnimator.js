/*global client, Backbone, moment, _, Q */
'use strict';

client.Models = client.Models || {};
// Utility functions

function pad(n) {
	return n < 10 ? '0' + n : n;
}

(function() {

	client.Models.MapAnimatorModel = Backbone.Model.extend({
		// List of layer names (dates) to iterate/animate over
		layers: [],

		initialize: function() {

			for (var i = 1953; i <= 2012; i++) {
				for (var j = 1; j <= 12; j++) {
					this.layers.push(i + '_' + pad(j));
				}
			}
			this.layerIndex = this.layers.length;
			_.bindAll(this);

			// We need a global context hook to handle the async promises/buffering?
			window.mapAnimatorModel = this;
		},

		// Each time we switch a layer...
		// (1) show the new layer
		// (2) hide the last layer
		// (2.1) destroy any layers outside of buffer range
		// (3) add a new request to prebuffer
		start: function() {

			var buffer = [];

			// Trigger layer loading for the first 10 layers, obtain promises + act when they're all resolved.
			for (var i = this.layerIndex - 1; i >= 0 && (this.layerIndex - i) <= 10; i--) {
				buffer.push(this.view.loadLayer(i));
			}

			// Wait until the buffer is full, then start cycling
			Q.allSettled(buffer).then(_.bind(function startUpdater(results) {
				window.mapAnimatorModel.startPlaying();				
			}), this);

		},

		startPlaying: function() {
			// Once the next ten layers are loaded, start switching between the layers
			this.updater = setInterval(_.bind(function switchToPreviousLayer() {
				var oldLayerIndex = this.layerIndex;
				--this.layerIndex;
				this.view.showLayer(this.layerIndex);
				this.view.hideLayer(oldLayerIndex);
				this.view.loadLayer(this.layerIndex - 10);
			}, this), 1000);
		},

		stop: function() {
			clearInterval(this.updater);
		}

	});

})();
