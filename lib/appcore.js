'use strict';

var Q = require('q'),
    path = require('path'),
    env = require('./env'),
    config = require('./config'),
    meddleware = require('meddleware'),
    debug = require('debuglog')('kraken/appcore');



/**
 *
 * @param kraken
 * @returns {*}
 */
function settings(kraken) {
    var deferred;

    function process() {
        var app, config;

        app = kraken.app;
        config = kraken.get('express') || {};
        Object.keys(config).forEach(function (key) {
            app.set(key, config[key]);
        });

        kraken.set('tls', env.tls(kraken));
        kraken.set('port', env.resolvePort(kraken));
        kraken.set('host', env.resolveHost(kraken));
        return kraken;
    }

    deferred = Q.defer();
    kraken.onconfig(deferred.makeNodeResolver());
    return deferred.promise.then(process);
}


/**
 *
 * @param kraken
 * @returns {*}
 */
function views(kraken) {
    var app, engines;

    app = kraken.app;
    engines = kraken.get('view engines');

    Object.keys(engines).forEach(function (ext) {
        var spec, module, args, engine;

        spec = engines[ext];
        module = require(spec.module);

        if (typeof module[spec.rendererFactory] === 'function') {
            args = Array.isArray(spec['arguments']) ? spec['arguments'].slice() : [];
            engine = module[spec.rendererFactory].apply(null, args);

        } else if (typeof module[spec.renderer] === 'function') {
            engine = module[spec.renderer];

        } else if (typeof module[spec.name] === 'function') {
            engine = module[spec.name];

        } else if (typeof module[ext] === 'function') {
            engine = module[ext];

        } else {
            engine = module;
        }

        // It's possible to override the default view, but it's a separate setting
        // than `view engine` so we need to do our best to keep them in sync here.
        if (app.get('view engine') === ext && typeof spec.viewConstructor === 'string') {
            app.set('view', require(spec.viewConstructor));
        }

        app.engine(ext, engine);
    });

    return kraken;
}


/**
 *
 * @param kraken
 * @returns {*}
 */
function middleware(kraken) {
    var app, settings;

    app = kraken.app;
    settings = kraken.get('middleware');

    app.use(meddleware(settings));
    return kraken;
}

/**
 *
 * @param kraken
 * @returns {*}
 */
function events(kraken) {
    var timer;
    kraken.app.on('shutdown', function onshutdown(timeout) {
        var exit, ok, err;

        exit = process.exit.bind(process);
        ok = exit.bind(null, 0);
        err = exit.bind(null, 1);

        debug('process shutting down');
        kraken.close(ok);
        clearTimeout(timer);
        timer = setTimeout(err, timeout);
    });
    return kraken;
}



module.exports = {

    settings: settings,

    views: views,

    middleware: middleware,

    events: events

};