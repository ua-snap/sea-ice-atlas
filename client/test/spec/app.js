/*global describe, it, chai, client */
'use strict';

(function () {
	describe('App router', function () {
		
		it('default route builds + renders the map', function() {
			this.appRouter.mapView.should.be.defined;
			var spy = sinon.spy(this.appRouter.mapView, 'render');
			this.appRouter.navigate('/');
			spy.should.have.been.calledOnce;
		});

		it('loads data from the info specified in the URL if present', function() {
			this.appRouter.navigate('/date/2011/10/3');
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
