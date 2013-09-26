/*global client, Backbone, _ */
'use strict';

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		'' : 'index',
		'date/:year/:month': 'renderByDate'
	},

	// Default view
	index: function() {
		this.checkIfRenderLayout();
		this.renderMap();
	},

	// User arrived via bookmark
	renderByDate: function(year, month) {
		this.checkIfRenderLayout();
		this.mapModel.set({
			year: year,
			month: month
		});
		this.renderMap();
	},

	checkIfRenderLayout: function() {
		if(false === this.hasRenderedLayout) {
			this.renderAppLayout();
			this.hasRenderedLayout = true;
		}
	},

	renderMap: function() {

		// mapView.render() returns a promise on initial run.  TODO: this may break if base map has already 
		// rendered, fix/defend.
		this.mapView.render().then(_.bind(function() {

			this.mapControlsView = new client.Views.MapControlsView({el: $('#mapControls'), model: this.mapModel});
			this.mapControlsView.render();

			this.mapAnimatorModel = new client.Models.MapAnimatorModel();
			this.mapAnimatorModel.mapModel = this.mapModel;

			this.mapAnimatorModel.on('change:layerIndex', function() {
				this.mapModel.set({
					month: this.mapAnimatorModel.get('month'),
					year: this.mapAnimatorModel.get('year')
				});
			}, this);
			
			this.mapAnimatorView = new client.Views.MapAnimatorView({
				el: $('#mapAnimationControls'),
				model: this.mapAnimatorModel,
				mapView: this.mapView
			});
			
			this.mapAnimatorModel.view = this.mapAnimatorView;
			this.mapAnimatorView.render();

		}, this));

	},

	// Flag to indicate if the main app layout has rendered or not
	hasRenderedLayout: false,

	renderAppLayout:  function() {
		this.appModel = new client.Models.ApplicationModel();
		this.appView = new client.Views.ApplicationView({el: $('#applicationWrapper'), model: this.appModel});

		this.mapModel = new client.Models.MapModel();
		this.mapView = new client.Views.MapView({model: this.mapModel});
		
		// When the user changes the controls, update the name of the layer being referenced
		this.mapModel.on('change', this.updateDate, this);

		// Render initial layout
		this.appView.render();
	},

	// Updates URL for bookmarking
	updateDate: function() {
		this.navigate('date/' + this.mapModel.get('year') + '/' + this.mapModel.get('month'));
	}
});
