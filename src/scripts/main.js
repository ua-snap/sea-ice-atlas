/*global client,Backbone */
'use strict';

window.client = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},

    // Application-wide configuration for client-side code.
    // Note, also update the server-side configuration (in ~/config.json) when changing these values.
    config: {
    	// Used for driving GUI for date range for available data.
    	startYear: 1853,
    	endYear: 2012
    },

    init: function () {
        window.appRouter = new client.Routers.ApplicationRouter();

        // Avoid pushState unless we configure the server to handle that properly.
        Backbone.history.start({pushState:false});
    }
};

/* Order and include as you please. */
require('build/templates.js');
require('src/scripts/views/*');
require('src/scripts/models/*');
require('src/scripts/collections/*');
require('src/scripts/routers/*');

$(document).ready(function () {
    client.init();
});