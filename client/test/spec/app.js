/* jshint expr: true */
/*global describe, it, Backbone, chai, client, beforeEach */
'use strict';

(function () {
	describe('App router', function () {
		beforeEach(function() {
			this.appRouter = new client.Routers.ApplicationRouter();
			try {
				Backbone.history.start({pushState:true});
			} catch (e) {} // dismiss exception due to history starting multiple times
		});

		it('default route builds + renders the map', function() {
			this.appRouter.hasRenderedLayout.should.be.false;
			this.appRouter.index();
			this.appRouter.mapView.should.be.defined;
			this.appRouter.hasRenderedLayout.should.be.true;
		});

		it('loads data from the info specified in the URL if present', function() {
			this.appRouter.navigate('/date/2011/10/3', { trigger: true });
			this.appRouter.mapModel.get('year').should.equal(2011);
			this.appRouter.mapModel.get('month').should.equal(10);
			this.appRouter.mapModel.get('week').should.equal(3);
		});

		it('checks if the URL date data is invalid, falling back to most current available', function() {
			this.appRouter.navigate('/date/2013/10/4');
			this.appRouter.mapModel.get('year').should.equal(2012);
			this.appRouter.mapModel.get('month').should.equal(12);
			this.appRouter.mapModel.get('week').should.equal(4);
		});
	});
})();
