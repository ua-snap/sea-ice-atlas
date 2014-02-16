/*global client, Backbone, moment, _, Q */
'use strict';

client.Models = client.Models || {};
// Utility functions

function pad(n) {
	return n < 10 ? '0' + n : n;
}

// This needs to be replaced with a little value object, shim for demo.

function parseToDate(idx) {
	var d = idx.split('_');
	return {
		year: d[0],
		month: d[1]
	};
}

(function() {

	client.Models.MapAnimatorModel = Backbone.Model.extend({

		defaults: {
			mode: 'sequential' // can be 'sequential' or 'monthly'
		},

		// List of layer names (dates) to iterate/animate over
		layers: [],

		initialize: function() {

			_.bindAll(this, 'enumerateLayers', 'buffer', 'start', 'startPlaying', 'stop');

		},

		// This code generates the names of the layers that will be requested, in the order they will be displayed.
		enumerateLayers: function() {

			var startYear = parseInt(this.mapModel.get('year'), 10);
			var startMonth = parseInt(this.mapModel.get('month'), 10);
			this.layers = [];
			var i;
			switch (this.get('mode')) {
				case 'monthly':
					for (i = startYear; i <= 2012; i++) {
						this.layers.push(i + '_' + pad(startMonth));
					}
					break;

				case 'sequential':
					// For the first year, cycle through remaining months
					for (i = startMonth; i <= 12; i++) {
						this.layers.push(startYear + '_' + pad(i));
					}

					for (i = startYear + 1; i <= 2012; i++) {
						for (var j = 1; j <= 12; j++) {
							this.layers.push(i + '_' + pad(j));
						}
					}
					break;

				default:
					break;
			}
			this.layerIndex = 0;

		},

		buffer: function() {

			// Array of promises which, when all resolved, mean the buffer is populated with valid layers.
			this.layerBuffer = [];
			var bufferIndex = this.layerIndex;

			// Trigger layer loading for the first 12 layers, obtain promises + act when they're all resolved;
			// Throttle this to fire one request every 150 milliseconds to avoid flooding the server.
			var bufferInterval = setInterval(_.bind(function() {

				// Load another layer
				this.layerBuffer.push(this.view.loadLayer(bufferIndex));
				// Once we've got 10 layers prebuffered, stop preloading.
				if (bufferIndex >= 12 || (bufferIndex + 1) >= this.layers.length) {
					clearInterval(bufferInterval);
				}
				bufferIndex++;
			}, this), 150);

		},

		// Populates the buffer, then initiates playing.
		start: function() {
			this.enumerateLayers();
			this.buffer();
			this.view.showBuffering();

			// Todo: this was firing too quickly, fix this by removing the setTimeout around this
			// and also causing the buffering to _immediately_ assign the promises instead of
			// delaying the first by 150ms (that delay means this code needs to be delayed as well)
			setTimeout(_.bind(function() {
				// Wait until the buffer is full, then start cycling.
				Q.allSettled(this.layerBuffer).then(_.bind(function startUpdater(results) {
					this.view.hideBuffering();
					this.startPlaying();
					this.view.enableControls();
				}, this));
			}, this), 1800);

		},

		startPlaying: function() {

			// This prevents multiple instances of the updater from running concurrently.
			// Before adding this, quickly switching between animation modes could cause the
			// animations to run crazy fast.
			if (false === _.isUndefined(this.updater)) {
				clearInterval(this.updater);
			}

			// Once the next ten layers are loaded, start switching between the layers
			this.updater = setInterval(_.bind(function switchToPreviousLayer() {

				// Set properties so other objects know that the layers have changed
				this.set(_.extend({
					layerIndex: this.layerIndex
				}, parseToDate(this.layers[this.layerIndex])));

				this.view.showLayer(this.layerIndex);

				if (this.layerIndex > 0) {
					this.view.hideLayer(this.layerIndex - 1);
				}

				++this.layerIndex;

				if (this.layerIndex >= this.layers.length) {
					this.stop();
				}

				// Only continue to buffer valid data layers
				if ((this.layerIndex + 10) <= this.layers.length) {
					this.view.loadLayer(this.layerIndex + 10);
				}

			}, this), 2000);
		},

		stop: function() {
			clearInterval(this.updater);
		}

	});

})();
