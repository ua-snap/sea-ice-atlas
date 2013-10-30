/*global client, Backbone, _, JST, OpenLayers, proj4 */
'use strict';

client.Views.ThresholdGraphicView = Backbone.View.extend({

	hasRendered: false,

        initialize: function() {
                _.bindAll(this, 'render', 'drawGraphic', 'loadData');
        },

	render: function() {
		
		if(
			false === _.isUndefined(this.model.get('lat'))
			&& false === _.isNaN(this.model.get('lat'))
			&& false === _.isUndefined(this.model.get('lon'))
			&& false === _.isNaN(this.model.get('lon'))
		) {
			console.log('ThresholdChart: Rendering')

			$('#graphicWrapper').show();
			$('#thresholdGraphicControls').show();
			if( false === this.hasRendered ) {
				$("#thresholdSlider").slider();
				$("#thresholdSlider").on('slide', function(slideEvt) {
					$("#thresholdSliderLabel").text(slideEvt.value);
				});
				$('#thresholdGraphicControls').on('click', function() {
					$.scrollTo($('#graphicWrapper'), 500, {
						offset: -80
					} );
				});
		        }
	      	}
	},

        drawGraphic: function() {
        		return;
		
        },

	loadData: function() {
		return;		
	}

});
