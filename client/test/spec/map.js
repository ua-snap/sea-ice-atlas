/* jshint expr: true */
/*global describe, it, client, sinon, Backbone, beforeEach */
'use strict';

(function () {
	describe('Map view', function() {
		it('calls its render() method when the dates in the map controls model change', function() {
			var spy = sinon.spy(this.mapView, 'render');
			this.mapControlsModel.set({year: 2011}); // triggers change event
			spy.should.have.been.calledOnce;
		});

		it('shows the title of the current map', function() {
			$('#mapContainer h1').should.have.text('Sea ice concentration');
			$('#mapContainer h2').should.have.text('December 2012, 4th week');
		});

		it('shows a legend explaining the meaning of the map', function() {
			$('#mapContainer div.legend').should.exist;
		});

	});

	describe('Map Controls model', function() {
		it('defaults to most-recent data layer', function() {
			this.mapControlsModel.get('year').should.equal(2012);
			this.mapControlsModel.get('month').should.equal(12);
			this.mapControlsModel.get('week').should.equal(4);
		});

		it('can construct the layer name to be used on the server', function() {
			this.mapControlsModel.getLayerName.should.equal('sic_mean_pct_weekly_ak_2012_12_w4');
		});
	});

	describe('Map date picker', function() {

		it('only lists valid date combinations to the user', function() {
			$('#mapControls_ymd select.year').should.have('option[value="1953"]');
			$('#mapControls_ymd select.year').should.not.have('option[value="1952"]');
			$('#mapControls_ymd select.year').should.have('option[value="2012"]');
			$('#mapControls_ymd select.year').should.not.have('option[value="2013"]');
		});

		it('has a year, month, and week component', function() {
			$('#mapControls_ymd select.year').should.exist;
			$('#mapControls_ymd select.month').should.exist;
			$('#mapControls_ymd select.week').should.exist;
		});
	});
})();