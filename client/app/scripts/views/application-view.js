/*global client, Backbone, JST*/

client.Views.ApplicationView = Backbone.View.extend({

    template: JST['app/scripts/templates/application.ejs'],
    render: function() {
    	this.$el.html(this.template(this.model.toJSON()));
    }
});
