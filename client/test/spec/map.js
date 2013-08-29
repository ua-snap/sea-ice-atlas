/*global describe, it, client */
'use strict';

(function () {
	describe('Map view', function() {
		it('calls its render() method when the dates in the model change', function() {
			var spy = sinon.spy(this.mapView, 'render');
			this.mapModel.set({year: 2011}); // triggers change event
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

	describe('Map model', function() {
		it('defaults to most-recent data layer', function() {
			this.mapModel.get('year').should.equal(2012);
			this.mapModel.get('month').should.equal(12);
			this.mapModel.get('week').should.equal(4);
		});

		// Idea here is to include a config thing for production vs. testing URLs
		it('composes the URL for the map by combining configuration + info from the model', function() {
			// Not sure yet if we want to use WMS or a tile index-based.
			this.mapModel.getLayerUrl.should.equal('not sure yet!');
		});

		it('can construct the layer name to be used on the server', function() {
			this.mapModel.getLayerName.should.equal('sic_mean_pct_weekly_ak_2012_12_w4');
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