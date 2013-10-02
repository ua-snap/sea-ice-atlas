/*global client, Backbone*/
'use strict';

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		'' : 'index'
	},

	index:  function() {
		var appModel = new client.Models.ApplicationModel();

		var appView = new client.Views.ApplicationView({el: $('#app'), model: appModel});
		var mapView = new client.Views.MapView({model: appModel});
		var chartView = new client.Views.ChartView({model: appModel});

		appView.render();
		mapView.render();
		chartView.render();
	}
});
