'use strict';

var Q = require('q'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    caller = require('caller'),
    express = require('express'),
    appcore = require('./lib/appcore'),
    debug = require('debuglog')('kraken'),
    EventEmitter = require('events').EventEmitter;


// Set on express apps by default:
//  'env'
//  'view'
//  'views'
//  'view cache'
//  'json spaces'
//  'x-powered-by'
//  'subdomain offset'
//  'jsonp callback name'

var proto = {

    use: function (route, handler) {
        if (typeof route !== 'string') {
            handler = route;
            route = '/';
        }

        function mount(app) {
            debug('mounting handler to', route);
            return app.use(route, handler);
        }

        handler.once('mount', function mount(parent) {
            // `express` sets several properties to default values, but we want
            // to force the mounted app to inherit any settings from the parent.
            // TODO: Is this the right thing or should we be more selective about
            // which props get overridden, like `env`, `view`, `views`, `x-powered-by`?
            handler.settings = Object.create(parent.settings);
            debug('handler mounted to', route);
        });

        debug('registering handler for', route);
        this._tasks = this._tasks.then(mount);
        return this;
    },


    listen: function (port, host, callback) {
        if (typeof port === 'function') {
            callback = port;
            port = undefined;
            host = undefined;
        }

        if (typeof host === 'function') {
            callback = host;
            host = undefined;
        }

        function uncaught(app) {
            if (!EventEmitter.listenerCount(process, 'uncaughtException')) {
                process.on('uncaughtException', function (err) {
                    console.error(new Date().toUTCString(), 'uncaughtException', err.message);
                    console.error(err.stack);
                    process.exit(1);
                });
            }
            return app;
        }

        function override(app) {
            port && app.set('port', port);
            host && app.set('host', host);
            debug('port is', port);
            debug('host is', host);
            return app;
        }

        function listen(app) {
            var deferred, server;

            deferred = Q.defer();

            function resolve() {
                server.removeListener('error', reject);
                deferred.resolve(server);
            }

            function reject(err) {
                server.removeListener('listening', resolve);
                deferred.reject(err);
            }

            debug('server created');
            server = app.get('tls') ? https.createServer(app.get('tls'), app) : http.createServer(app);
            server.once('listening', resolve);
            server.once('error', reject);
            server.listen(app.get('port'), app.get('host'));

            return deferred.promise;
        }

        function print(server) {
            var socket = server.address();
            debug('Listening on %s', typeof socket === 'string' ? socket : String(socket.port));
            return server;
        }

        return this._tasks
            .then(uncaught)
            .then(override)
            .then(listen)
            .then(print)
            .nodeify(callback);
    }

};





exports.create = function create(delegate) {
    var basedir, instance;

    function assign(app) {
        debug('app created');
        return instance.app = app;
    }

    basedir = path.dirname(caller());
    instance = Object.create(proto, {
        _tasks: {
            value: appcore.create(basedir, delegate || {}).then(assign),
            writable: true
        },
        app: {
            value: undefined,
            writable: true,
            enumerable: true
        }
    });

    return instance;
};


exports.isKraken = function (obj) {
    return Object.getPrototypeOf(obj) === proto;
};

