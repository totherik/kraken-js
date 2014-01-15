'use strict';

var Q = require('q'),
    http = require('http'),
    https = require('https'),
    appcore = require('./appcore'),
    EventEmitter = require('events').EventEmitter;


var slice = Function.prototype.call.bind(Array.prototype.slice);

/**
 *
 * @param route
 * @param fn
 * @returns {use}
 */
function use(route, fn) {
    if (typeof route !== 'string') {
        fn = route;
        route = '/';
    }

    fn.once('mount', function onmount(parent) {
        fn.settings = Object.create(parent.settings);
    });

    fn.once('mount', function onmount(parent) {
        parent.on('newListener', function replay(event) {
            var args;

            if (event !== 'mount') {
                args = slice(arguments);
                args.unshift(parent);
                fn.on(event, parent.emit.bind.apply(parent.emit, args));
            }
        });
    });

    this._tasks.then(function mount(kraken) {
        kraken.app.use(route, fn);
        return kraken;
    });

    return this;
}


/**
 *
 * @param callback
 * @returns {listen}
 */
function listen(callback) {
    var self = this;

    function bind(kraken) {
        var app, server, deferred;

        function listening() {
            kraken._server = server;
            app.set('server', server);

            deferred.resolve(kraken);
            self.emit('listening');
            self.removeListener('error', error);
        }

        function error(err) {
            deferred.reject(err);
            self.removeListener('listening', listening);
        }

        function close() {
            self.emit('close');
        }

        app = kraken.app;

        server =  kraken.get('tls') ? https.createServer(kraken.get('tls'), app) : http.createServer(app);
        server.once('listening', listening);
        server.once('error', error);
        server.once('close', close);
        server.listen(kraken.get('port'), kraken.get('host'), callback);

        deferred = Q.defer();
        return deferred.promise;
    }

    function error(err) {
        self.emit('error', err);
    }

    this._tasks
        .then(appcore.events)
        .then(appcore.settings)
        .then(appcore.views)
        .then(appcore.middleware)
        .then(bind)
        .catch(error);

    return this;
}


/**
 *
 * @param fn
 * @returns {close}
 */
function close(fn) {
    if (!this._server) {
        throw new Error('Server not started.');
    }

    this.emit('disconnecting');
    this._server.unref();
    this._server.close(fn);
    return this;
}






module.exports = function () {

    return {

        __proto__: new EventEmitter(),

        use: use,

        listen: listen,

        close: close,

        get: function (key) {
            return this._settings.get(key);
        },

        set: function (key, value) {
            this._settings.set(key, value);
        }

    };

};