/*global client, Backbone*/
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
		this.mapControlsModel.set({
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
			console.log('preparing to render controls!');
			this.mapControlsView = new client.Views.MapControlsView({el: $('#mapControls'), model: this.mapControlsModel});
			this.mapControlsView.render();
			console.log('controls rendered, starting animation')
			this.mapAnimatorModel = new client.Models.MapAnimatorModel();
			this.mapAnimatorView = new client.Views.MapAnimatorView({el: $('#mapAnimationControls'), model: this.mapAnimatorModel});
			this.mapAnimatorView.map = this.mapView.map;
			this.mapAnimatorModel.view = this.mapAnimatorView;
			this.mapAnimatorView.render();
		}, this));

	},

	// Flag to indicate if the main app layout has rendered or not
	hasRenderedLayout: false,

	renderAppLayout:  function() {
		this.appModel = new client.Models.ApplicationModel();
		this.appView = new client.Views.ApplicationView({el: $('#applicationWrapper'), model: this.appModel});

		this.mapControlsModel = new client.Models.MapControlsModel();
		this.mapView = new client.Views.MapView({model: this.mapControlsModel});
		
		// When the user changes the controls, update the name of the layer being referenced
		this.mapControlsModel.on('change', this.updateDate, this);

		// Render initial layout
		this.appView.render();
	},

	updateDate: function() {
		this.navigate('date/' + this.mapControlsModel.get('year') + '/' + this.mapControlsModel.get('month'));
	}
});
