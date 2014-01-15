'use strict';

var Q = require('q'),
    path = require('path'),
    env = require('./env'),
    func = require('./func'),
    express = require('express'),
    config = require('./config'),
    meddleware = require('meddleware'),
    debug = require('debuglog')('kraken/appcore');



function createConfig(basedir) {
    var options = {
        filenames: [ 'app', 'middleware' ],
        basedirs: [
            path.join(basedir, 'config'),
            path.resolve(__dirname, '..', 'config')
        ]
    };

    return config.create(basedir, options);
}



function loadConfiguration(app, delegate, callback) {
    var basedir, settings, complete;

    function configureExpress(settings) {
        var config;

        app.set('tls',  env.tls(settings));
        app.set('env',  settings.get('env'));
        app.set('ssl',  settings.get('ssl'));
        app.set('port', env.resolvePort(settings));
        app.set('host', env.resolveHost(settings));

        config = settings.get('express') || {};
        Object.keys(config).forEach(function (key) {
            this.set(key, config[key]);
        }, app);

        return settings;
    }

    basedir = app.get('basedir');
    settings = createConfig(basedir);
    complete = func.fork(configureExpress, callback);

    if (typeof delegate.configure === 'function') {
        delegate.configure(settings, complete);
        return;
    }

    complete(null, settings);
}



function initializeViewRenderer(app, settings) {
    var engines;

    engines = settings.get('view engines');
    Object.keys(engines).forEach(function (ext) {
        var spec, module, args, engine;

        spec = engines[ext];
        module = require(spec.module);

        if (typeof module[spec.factoryMethod] === 'function') {
            args = Array.isArray(spec['arguments']) ? spec['arguments'].slice() : [];
            engine = module[spec.factoryMethod].apply(null, args);

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

}



function registerMiddleware(app, delegate, settings) {
    var config;

    if (typeof delegate.requestStart === 'function') {
        app.once('middleware:after:favicon', function (eventargs) {
            debug('invoking requestStart');
            delegate.requestStart(eventargs.app);
        });
    }

    if (typeof delegate.requestBeforeRoute === 'function') {
        app.once('middleware:before:router', function (eventargs) {
            debug('invoking requestBeforeRoute');
            delegate.requestBeforeRoute(eventargs.app);
        });
    }

    if (typeof delegate.requestAfterRoute === 'function') {
        app.once('middleware:after:router', function (eventargs) {
            debug('invoking requestAfterRoute');
            delegate.requestAfterRoute(eventargs.app);
        });
    }

    config = settings.get('middleware') || {};
    app.use(meddleware(config));
}



exports.create = function (basedir, delegate, callback) {
    var app;

    function config(app) {
        var deferred = Q.defer();
        loadConfiguration(app, delegate, deferred.makeNodeResolver());
        return deferred.promise;
    }

    function views(app) {
        return function (settings) {
            app.get('view engine') && initializeViewRenderer(app, settings);
            return settings;
        };
    }

    function middleware(app) {
        return function (settings) {
            registerMiddleware(app, delegate, settings);
            return settings;
        };
    }

    function appify(app) {
        return function () {
            return app;
        };
    }

    app = express();
    app.set('basedir', basedir);

    return config(app)
        .then(views(app))
        .then(middleware(app))
        .then(appify(app))
        .nodeify(callback);
};