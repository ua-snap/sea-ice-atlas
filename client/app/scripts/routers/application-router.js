/*global client, Backbone*/
'use strict';

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		'' : 'index',
		'date/:year/:month': 'renderByDate'
	},

	index: function() {
		if(false === this.hasRenderedLayout) {
			this.renderAppLayout();
			this.hasRenderedLayout = true;
		}
		this.renderMap();
	},

	renderByDate: function(year, month) {
		if(false === this.hasRenderedLayout) {
			this.renderAppLayout();
			this.hasRenderedLayout = true;
		}
		this.mapControlsModel.set({
			year: year,
			month: month
		});
		this.renderMap();
	},

	renderMap: function() {
		this.mapView.render();
		this.mapControlsView = new client.Views.MapControlsView({el: $('#mapControls'), model: this.mapControlsModel});
		this.mapControlsView.render();
	},

	// Flag to indicate if the main app layout has rendered or not
	hasRenderedLayout: false,

	renderAppLayout:  function() {
		this.appModel = new client.Models.ApplicationModel();
		this.appView = new client.Views.ApplicationView({el: $('#applicationWrapper'), model: this.appModel});

		this.mapModel = new client.Models.MapModel();
		this.mapView = new client.Views.MapView({model: this.mapModel});

		this.mapControlsModel = new client.Models.MapControlsModel();

		// When the user changes the controls, update the name of the layer being referenced
		//this.mapControlsModel.on('change', this.mapModel.setMapLayer, this.mapModel);
		this.mapControlsModel.on('change', this.updateDate, this);

		// Render initial layout
		this.appView.render();
	},

	updateDate: function() {
		this.mapModel.setMapLayer(this.mapControlsModel);
		this.navigate('date/' + this.mapControlsModel.get('year') + '/' + this.mapControlsModel.get('month'));
	}
});
