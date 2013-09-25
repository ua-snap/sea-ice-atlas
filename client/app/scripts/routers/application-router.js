/*global client, Backbone*/
'use strict';

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		'' : 'index'
	},

	index:  function() {
		var appModel = new client.Models.ApplicationModel();

		var appView = new client.Views.ApplicationView({el: $('#app'), model: appModel});
		var mapView = new client.Views.MapView();
		var chartView = new client.Views.ChartView();

		appView.render();
		mapView.render();
		chartView.render();
	}
});
