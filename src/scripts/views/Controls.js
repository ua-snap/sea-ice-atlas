/*global client, Backbone, JST, _ */
'use strict';

client.Views.MapControlsView = Backbone.View.extend({

	events: {
		'change select, input' : 'updateAttributes'
	},
	initialize: function() {
		this.model.on('change', this.updateControls, this);
	},
	template: JST['src/scripts/templates/MapControls.ejs'],

	render: function() {

		this.$el.html(this.template());

		var range = _.range(client.config.startYear, client.config.endYear + 1);
		var yearSelect = $(this.$el.find('select.year')[0]);
		_.each(range, function(year) {
			yearSelect.append($('<option>', {
				value: year,
				text: year
			}));
		});

		this.updateControls();

	},

	updateControls: function() {

		this.$el.find('select.year').val(this.model.get('year'));
		this.$el.find('select.month').val(this.model.get('month'));

                if(
                        false === _.isUndefined(this.model.get('lat'))
                        && false === _.isNaN(this.model.get('lat'))
                        && false === _.isUndefined(this.model.get('lon'))
                        && false === _.isNaN(this.model.get('lon'))
                ) {
			this.$el.find('input#lat').val(this.formatCoord(this.model.get('lat')));
			this.$el.find('input#lon').val(this.formatCoord(this.model.get('lon')));
		}	

	},

	// If we need to do a lot of these, we should replace this with some proper model binding module
	// such as http://nytimes.github.io/backbone.stickit/
	updateAttributes: function(event) {
		event.stopImmediatePropagation();

		var attr = {};
		attr[event.target.name] = event.target.value;

		// Force coordinates to be inside the data set bounding box.
		if(event.target.name == 'lat') {
			attr[event.target.name] = parseFloat(attr[event.target.name]);
			attr[event.target.name] = Math.min(attr[event.target.name], 80.375);
			attr[event.target.name] = Math.max(attr[event.target.name], 40.125);
		} else if (event.target.name == 'lon') {
			attr[event.target.name] = parseFloat(attr[event.target.name]);
			attr[event.target.name] = Math.min(attr[event.target.name], -120);
			attr[event.target.name] = Math.max(attr[event.target.name], -180);
		}

		this.model.set(attr);
	},

	formatCoord: function formatCoord(coord) {
		return (Math.round(coord * 4) / 4).toFixed(2);
	}

});
