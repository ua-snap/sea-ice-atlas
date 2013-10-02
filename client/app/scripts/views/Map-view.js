/*global client, Backbone, JST, OpenLayers, proj4 */
'use strict';

client.Views.MapView = Backbone.View.extend({

        initialize: function() {
                _.bindAll(this);
		this.destProj = new OpenLayers.Projection('EPSG:3338');
		this.sourceProj = new OpenLayers.Projection('EPSG:4326');
		this.createMap();
        },

	template: JST['app/scripts/templates/Map.ejs'],

	createMap: function() {
                OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
                        model: this.model,
			coordinateClicked: this.coordinateClicked,

                        defaultHandlerOptions: {
                                'single': true,
                                'double': false,
                                'pixelTolerance': 0,
                                'stopSingle': false,
                                'stopDouble': false
                        },

                        initialize: function(options) {
                                this.handlerOptions = OpenLayers.Util.extend(
                                        {}, this.defaultHandlerOptions
                                );

                                OpenLayers.Control.prototype.initialize.apply(
                                        this, arguments
                                );

                                this.handler = new OpenLayers.Handler.Click(
                                        this, {
                                                'click': this.coordinateClicked
                                        }, this.handlerOptions
                                );
                        },
                });

		var extent = new OpenLayers.Bounds(-9036842.762,-9036842.762, 9036842.762, 9036842.762);

		var map = new OpenLayers.Map('map',{
			maxExtent:extent,
			restrictedExtent:extent,
			units:'m',
			wrapDateLine:false,
			projection:this.destProj,
			displayProjection:this.destProj
		});

		var ginaLayer = new OpenLayers.Layer.WMS(
			'GINA WMS',//layer label
			'http://wms.alaskamapped.org/bdl/',
			{
				layers: 'BestDataAvailableLayer' //layer wms name
			},
			{
				animationEnabled:true,
				isBaseLayer:true,
				transitionEffect: 'resize',
				attribution: 'Best Data Layer provided by <a href="http://www.gina.alaska.edu">GINA</a>'
			}
		);

		var cacheWms = new OpenLayers.Layer.WMS(
			'Cache WMS Sea Ice Atlas',
			'http://tiles.snap.uaf.edu/cgi-bin/mapserv?map=/var/www/html/bruce-seaiceatlas.map',
			{
				layers: 'seaiceatlas',
				transparent: true,
				format: 'image/png'
			},
			{
				isBaseLayer: false,
				visibility: true
			}
		);

		map.addLayers([ginaLayer]);
		map.setCenter(new OpenLayers.LonLat(118829.786, 1310484.872).transform(map.displayProjection, map.projection), 4);

		var click = new OpenLayers.Control.Click();
                map.addControl(click);
                click.activate();

		this.map = map;
	},

	render: function() {

	},

	coordinateClicked: function(e) {
		var lonlat = this.map.getLonLatFromPixel(e.xy);

		lonlat.transform(this.destProj, this.sourceProj);

		this.model.set({
			'lon' : lonlat.lon,
			'lat' : lonlat.lat
		});
	}

});
