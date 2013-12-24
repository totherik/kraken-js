'use strict';

var tls = require('tls'),
    path = require('path');

function asArray(value) {
    return Array.isArray(value) ? value : [ value ];
}


exports.tls = function (config) {
    var settings = config.get('tls');
    if (settings) {
        tls.SLAB_BUFFER_SIZE    = settings.SLAB_BUFFER_SIZE    || tls.SLAB_BUFFER_SIZE;
        tls.CLIENT_RENEG_LIMIT  = settings.CLIENT_RENEG_LIMIT  || tls.CLIENT_RENEG_LIMIT;
        tls.CLIENT_RENEG_WINDOW = settings.CLIENT_RENEG_WINDOW || tls.CLIENT_RENEG_WINDOW;
    }
    return settings;
};


exports.resolvePort = function resolvePort(config) {
    var port = config.get('port');

    if (port) {
        asArray(port).some(function (env) {
            var value;
            value = (typeof env === 'number') ? env : this.get(env);
            port = parseInt(value, 10);
            port = isNaN(port) ? value : port;
            return !!port;
        }, config);
    }

    return port;
};


exports.resolveHost = function resolveHost(config) {
    var host;

    if (typeof exports.resolvePort(config) === 'string') {
        // Port is a file descriptor, so host is noop
        return undefined;
    }

    host = config.get('host');
    if (host) {
        asArray(host).some(function (env) {
            host = config.get(env);
            return !!host;
        });
    }

    return host;
};