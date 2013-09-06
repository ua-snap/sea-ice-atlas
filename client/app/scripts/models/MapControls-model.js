/*global client, Backbone, _ */
'use strict';

client.Models.MapControlsModel = Backbone.Model.extend({
	
	defaults: {
		year: 2012,
		month: 12,
		week: 4
	},

	getLayerName: function() {
		return _.template('sic_mean_pct_weekly_ak_<%= year %>_<%= month =>_<%= week %>', this.toJSON());
	}
});