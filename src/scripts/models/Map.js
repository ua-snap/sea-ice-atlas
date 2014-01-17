/*global client, Backbone*/

client.Models = client.Models || {};

(function() {
	'use strict';

	client.Models.MapModel = Backbone.Model.extend({
		defaults: function() {
			return {
				month: '01',
				year: client.config.startYear,
				concentration: 30
			};
		}
	}
	);

})();
