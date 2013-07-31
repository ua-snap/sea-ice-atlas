/*global describe, it */
'use strict';

chai.should();

(function () {
    describe('Give it some context', function () {
        describe('maybe a bit more context here', function () {
            it('should run here few assertions', function () {
            	var appModel = new client.Models.ApplicationModel();
		var appView = new client.Views.ApplicationView({el: $('#sandbox'), model: appModel});
		appView.render();
		$('#sandbox h1').text().should.equal('Sea Ice Atlas');
            });
        });
    });
})();
