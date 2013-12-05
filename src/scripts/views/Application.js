/* global client, Backbone, JST */
/* unused:true */
'use strict';

client.Views.ApplicationView = Backbone.View.extend({

	template: JST['src/scripts/templates/application.ejs'],

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		this.$el.find('#controlsWrapper').affix({
			offset: {
				top: 60,
				bottom: function() {
					return (this.bottom = $('footer#footer.well.well-small').outerHeight(true) + 10)
				}
			}
		})
	}

});
