/*global client, Backbone*/

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		"" : "index"
	},

	index:  function() {
		var appModel = new client.Models.ApplicationModel();
		var appView = new client.Views.ApplicationView({el: $('#app'), model: appModel});
		appView.render();
	}
});
