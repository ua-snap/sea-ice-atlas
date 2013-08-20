/*global describe, it, chai, client */
'use strict';

chai.should();

(function () {
	describe('Map model', function() {
		it('exists', function() {
			var mapModel = new client.Models.MapModel();
			mapModel.should.exist();
		});
	});
})();
