/*global client, Backbone*/

client.Models = client.Models || {};

(function() {
	'use strict';

	client.Models.MapModel = Backbone.Model.extend({
		defaults: {
			month: '01',
			year: 1953,
			concentration: 30
		}
	});

})();
