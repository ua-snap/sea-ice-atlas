/* global client, Backbone, JST */
/* unused:true */
'use strict';

client.Views.ApplicationView = Backbone.View.extend({
	template: JST['app/scripts/templates/application.ejs'],

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
	},
});
