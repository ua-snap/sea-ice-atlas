/*global client, Backbone, JST, _ */
'use strict';

client.Views.MapControlsView = Backbone.View.extend({

	events: {
		'change select' : 'updateDate'
	},
	
	template: JST['app/scripts/templates/MapControls.ejs'],

	render: function() {

		this.$el.html(this.template());

		var range = _.range(1953, 2013);
		var yearSelect = $(this.$el.find('select.year')[0]);
		_.each(range, function(year) {
			yearSelect.append($('<option>', {
				value: year,
				text: year
			}));
		});

		this.$el.find('select.year').val(this.model.get('year'));
		this.$el.find('select.month').val(this.model.get('month'));
		this.$el.find('select.week').val(this.model.get('week'));

	},

	// If we need to do a lot of these, we should replace this with some proper model binding module
	// such as http://nytimes.github.io/backbone.stickit/
	updateDate: function(event) {
		var attr = {};
		attr[event.target.name] = parseInt(event.target.value, 10); // Keep data type numeric, radix 10
		this.model.set(attr);
	}

});
