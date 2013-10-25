/*global client, Backbone, _ */
'use strict';

// Utility needed to keep affixed content in check
$(document).ready(function () {

/*
* Clamped-width. 
* Usage:
*  <div data-clampedwidth=".myParent">This long content will force clamped width</div>
*
* Author: LV
*/


});

client.Routers.ApplicationRouter = Backbone.Router.extend({
	routes: {
		'' : 'index',
		'date/:year/:month': 'renderByDate'
	},

	// Default view
	index: function() {
		this.checkIfRenderLayout();
		this.renderMap();
	},

	// This code resets the GUi when switching between the animation and map modes.
	mapMode: 'map',
	setMapMode: function(mode) {
		switch(mode) {
			case 'map':
				$('#mapControls').addClass('active');
				$('#mapAnimationControls').removeClass('active');
				break;
			case 'animation':
				$.scrollTo( $('#mapGroupWrapper'), 500, {
					offset: -80
				});

				$('#mapControls').removeClass('active');
				$('#mapAnimationControls').addClass('active');
				$('#concentrationGraphControls').hide('fast');
				$('#thresholdGraphicControls').hide('fast');
				$('#chartWrapper').hide('fast');
				$('#openWaterGraphic').hide('fast');

				break;
		}
	},

	// User arrived via bookmark
	renderByDate: function(year, month) {
		this.checkIfRenderLayout();
		this.mapModel.set({
			year: year,
			month: month
		}, {silent:true}); // silent because otherwise it triggers a change event, unwanted here.
		this.renderMap();
	},

	checkIfRenderLayout: function() {
		if(false === this.hasRenderedLayout) {
			this.renderAppLayout();
			this.hasRenderedLayout = true;
		}
	},

	renderMap: function() {

		// mapView.render() returns a promise on initial run.  TODO: this may break if base map has already 
		// rendered, fix/defend.
		this.mapView.render().then(_.bind(function() {

			this.mapControlsView = new client.Views.MapControlsView({el: $('#mapControls'), model: this.mapModel});
			this.mapControlsView.render();

			this.mapAnimatorModel = new client.Models.MapAnimatorModel();
			this.mapAnimatorModel.mapModel = this.mapModel;

			this.mapAnimatorModel.on('change:layerIndex', function() {
				this.mapModel.set({
					month: this.mapAnimatorModel.get('month'),
					year: this.mapAnimatorModel.get('year')
				});
			}, this);
			
			this.mapAnimatorView = new client.Views.MapAnimatorView({
				el: $('#mapAnimationControls'),
				model: this.mapAnimatorModel,
				mapView: this.mapView
			});
			
			// For the animation, the model and view need to collaborate, so the view is assigned directly to the model
			this.mapAnimatorModel.view = this.mapAnimatorView;
			this.mapAnimatorView.render();

			this.mapView.loadLayer(this.mapModel.get('year'), this.mapModel.get('month'));

			$('#mapControls').show();
			$('#mapAnimationControls').show();
			$('#loadingMap').hide();


		}, this));

	},

	// Flag to indicate if the main app layout has rendered or not
	hasRenderedLayout: false,

	renderAppLayout:  function() {
		this.appModel = new client.Models.ApplicationModel();
		this.appView = new client.Views.ApplicationView({el: $('#applicationWrapper'), model: this.appModel});

		this.mapModel = new client.Models.MapModel();
		this.mapView = new client.Views.MapView({model: this.mapModel});
		this.chartView = new client.Views.ChartView({model: this.mapModel});
		this.thresholdGraphicView = new client.Views.ThresholdGraphicView({model: this.mapModel});

		// When the user changes the controls, update the name of the layer being referenced
		this.mapModel.on('change', this.updateDate, this);
		
		// Render initial layout
		this.appView.render();
		clampSidebarWidth();
	},

	// Updates URL for bookmarking
	updateDate: function() {
		this.navigate('date/' + this.mapModel.get('year') + '/' + this.mapModel.get('month'));
	}
});

function clampSidebarWidth() {
	
	// This code is needed to ensure the affixed navbar retains the correct width.
	// https://github.com/twbs/bootstrap/issues/6350
	$('[data-clampedwidth]').each(function () {
	    var elem = $(this);
	    var parentPanel = elem.data('clampedwidth');
	    var resizeFn = function () {
	        var sideBarNavWidth = $(parentPanel).width() - parseInt(elem.css('paddingLeft')) - parseInt(elem.css('paddingRight')) - parseInt(elem.css('marginLeft')) - parseInt(elem.css('marginRight')) - parseInt(elem.css('borderLeftWidth')) - parseInt(elem.css('borderRightWidth'));
	        elem.css('width', sideBarNavWidth);
	    };

	    resizeFn();
	    $(window).resize(resizeFn);
	});

}