/*global client, Backbone, _ */
'use strict';

client.Models.MapModel = Backbone.Model.extend({
	defaults: {
		layer: 'sic_mean_pct_weekly_ak_2012_12'
	},
	setMapLayer: function(mapControlsModel) {
		this.set({
			layer: _.template('sic_mean_pct_weekly_ak_<%= year %>_<%= month %>', mapControlsModel.toJSON())
		});
	}
});
