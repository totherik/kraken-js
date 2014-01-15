'use strict';

var Q = require('q'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    caller = require('caller'),
    endgame = require('endgame'),
    express = require('express'),
    appcore = require('./lib/appcore'),
    debug = require('debuglog')('kraken'),
    slice = Function.prototype.call.bind(Array.prototype.slice);


endgame();


function replay(event, src, dest) {
    src.on(event, function () {
        var args = slice(arguments);
        args.unshift(event);
        dest.emit.apply(dest, args);
    });
}


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

        function override(app) {
            port && app.set('port', port);
            host && app.set('host', host);
            debug('port is', port);
            debug('host is', host);
            return app;
        }

        function listen(app) {
            var server, deferred;

            function listening() {
                app.removeListener('error', error);
                deferred.resolve(server);
            }

            function error(err) {
                app.removeListener('listening', listening);
                deferred.reject(err);
            }

            function disconnect(server) {
                server.close(process.exit.bind(process, 0));
                setTimeout(process.exit.bind(process, 1), 30 * 1000);
            }

            function close(server) {

            }

            app.once('listening', listening);
            app.once('error', error);
            app.once('disconnect', disconnect);
            app.once('close', close);

            debug('server created');
            server = app.get('tls') ? https.createServer(app.get('tls'), app) : http.createServer(app);
            replay('listening', server, app);
            replay('error', server, app);
            replay('close', server, app);
            server.listen(app.get('port'), app.get('host'));

            app.close = function (handler) {
                app.emit('disconnecting', server);
                server.close(handler);
            };

            deferred = Q.defer();
            return deferred.promise;
        }

        function print(server) {
            var socket = server.address();
            debug('Listening on %s', typeof socket === 'string' ? socket : String(socket.port));
            return server;
        }

        return this._tasks
            .then(override)
            .then(listen)
            .then(print)
            .nodeify(callback);
    }

};



exports.create = function create(delegate) {
    var basedir, tasks, instance;

    delegate = delegate || {};
    basedir = path.dirname(caller());
    tasks = appcore
        .create(basedir, delegate)
        .then(function assign(app) {
            debug('app created');
            return instance.app = app;
        });

    instance = Object.create(proto, {
        _tasks: {
            value: tasks,
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

