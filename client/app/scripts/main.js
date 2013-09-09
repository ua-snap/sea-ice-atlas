/*global client,Backbone */
'use strict';

window.client = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},
    init: function () {
        var appRouter = new client.Routers.ApplicationRouter();
        Backbone.history.start({pushState:false});
    }
};

/* Order and include as you please. */
require('.tmp/scripts/templates');
require('app/scripts/views/*');
require('app/scripts/models/*');
require('app/scripts/collections/*');
require('app/scripts/routers/*');

$(document).ready(function () {
    client.init();
});
