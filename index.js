'use strict';

var Q = require('q'),
    path = require('path'),
    caller = require('caller'),
    express = require('express'),
    proto = require('./lib/proto'),
    config = require('./lib/config');

var apps = {};


function create(name) {
    var basedir, settings, kraken;

    basedir = path.dirname(caller());
    settings = config.create(basedir, {
        filenames: [ 'app', 'middleware' ],
        basedirs:  [
            path.join(basedir, 'config'),
            path.resolve(__dirname, '..', 'config')
        ]
    });

    return kraken = Object.create(proto(), {

        _tasks: {
            value: Q.fcall(function () {
                return kraken;
            })
        },

        _settings: {
            get: function () {
                return settings;
            }
        },

        _server: {
            enumerable: false,
            writable: true,
            value: undefined
        },

        app: {
            enumerable: true,
            writable: false,
            value: express()
        },

        name: {
            enumerable: true,
            writable: false,
            value: name
        },

        onconfig: {
            enumerable: true,
            writable: true,
            value: function noop(config, callback) {
                setImmediate(callback.bind(null, null, config));
            }
        }

    });
}


module.exports = function kraken(name) {
    name = name || 'default';

    if (name in apps) {
        return apps[name];
    }

    return apps[name] = create(name);
};