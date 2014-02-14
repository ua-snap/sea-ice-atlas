/*global client, Backbone, JST, OpenLayers, proj4, moment, _, Q */
'use strict';

client.Views.MapAnimatorView = Backbone.View.extend({
	initialize: function() {

		_.bindAll(this, 'play', 'pause', 'setMode', 'playSequentialMode', 'playMonthlyMode',
			'render', 'showLayer', 'loadLayer', 'hideLayer', 'showBuffering', 'hideBuffering');
		// Set up some shortcuts
		this.map = this.options.mapView.map;
		this.model = this.options.model;

	},

	template: JST['src/scripts/templates/MapAnimator.ejs'],

	// Used for buffering layers for animation
	layers: {},

	// Will contain promises corresponding to the load status of each layer.
	promises: {},

	events: {
		'click button' : 'focus',
		'click #sequentialAnimationPlay' : 'playSequentialMode',
		'click #sequentialAnimationPause' : 'pause',
		'click #monthlyAnimationPlay' : 'playMonthlyMode',
		'click #monthlyAnimationPause' : 'pause'
	},

	focus: function(event) {
		$.scrollTo( $('#mapGroupWrapper'), 500, {
			offset: -80
		});
		window.appRouter.setMapMode('animation');
	},

	resetLayers: function() {
		var k = this.map.getLayersBy('isBaseLayer', false);
		_.each(k, _.bind(function(e, i, l) {
			this.map.removeLayer(e);
		}, this));
	},

	setMode: _.debounce(function(mode) {
		this.model.set({mode:mode});
	}, 1000, true),

	play: _.debounce(function() {
		this.resetLayers();
		this.model.start();
	}, 1000, true),

	pause: function() {
		this.model.stop();
	},

	playSequentialMode: function() {
		this.setMode('sequential');
		this.play();
	},

	playMonthlyMode: function() {
		this.setMode('monthly');
		this.play();
	},

	render: function() {
		this.$el.html(this.template());
	},

	showLayer: function(layerIndex) {
		if( 'undefined' === typeof this.layers[this.model.layers[layerIndex]]) {
			return;
		}
		$('#mapTitle').text('Historical Sea Ice Concentration, ' + moment(this.model.layers[layerIndex], 'YYYY_MM').format('MMMM YYYY'));
		this.layers[this.model.layers[layerIndex]].setOpacity(1);
	},

	loadLayer: function(layerIndex) {
		this.promises[this.model.layers[layerIndex]] = Q.defer();
		var dateJson = {
			month: this.model.layers[layerIndex].substring(5),
			year: this.model.layers[layerIndex].substring(0,4)
		};
		
		this.layers[this.model.layers[layerIndex]] = new OpenLayers.Layer.WMS(
			this.model.layers[layerIndex],
			'http://tiles.snap.uaf.edu/tilecache/tilecache.py/2.11.0/',
			{
				layers: _.template(client.config.mapLayerNameTemplate, dateJson),
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true, // Doesn't load unless visibility is true
				layerIndex: layerIndex, // passed in to the loadend event, used there
				buffer: 0 // don't load extra tiles around the main map
			}
		);
		this.layers[this.model.layers[layerIndex]].setOpacity(0); // Hide, but still load

		// When the "loadend" event is triggered on the layer, resolve its initial loading promise.
		this.layers[this.model.layers[layerIndex]].events.register('loadend', this, function(layer) {
			this.promises[this.model.layers[layer.object.layerIndex]].resolve(layer);
		});
		
		// Map loading only starts happening when the addLayer method is invoked.
		this.map.addLayer(this.layers[this.model.layers[layerIndex]]);

		return this.promises[this.model.layers[layerIndex]].promise;
	},

	hideLayer: function(layerIndex) {

		if( 'undefined' === typeof this.layers[this.model.layers[layerIndex]]) {
			return;
		}

		 this.layers[this.model.layers[layerIndex]].setOpacity(0);
	},

	showBuffering: function() {
		$('#animationBuffering').show(400);
	},

	hideBuffering: function() {
		$('#animationBuffering').hide(400);
	}
});
