'use strict';

var tls = require('tls'),
    test = require('tape'),
    env = require('../lib/env');


function shim(data) {
    data = data || {};
    return {
        get: function (key) {
            return data[key];
        }
    };
}


test('tls', function (t) {

    var defaults = {
        SLAB_BUFFER_SIZE: tls.SLAB_BUFFER_SIZE,
        CLIENT_RENEG_LIMIT: tls.CLIENT_RENEG_LIMIT,
        CLIENT_RENEG_WINDOW: tls.CLIENT_RENEG_WINDOW
    };

    t.test('doesn\'t have tls settings', function (t) {
        env.tls(shim());
        t.equal(tls.SLAB_BUFFER_SIZE, defaults.SLAB_BUFFER_SIZE);
        t.equal(tls.CLIENT_RENEG_LIMIT, defaults.CLIENT_RENEG_LIMIT);
        t.equal(tls.CLIENT_RENEG_WINDOW, defaults.CLIENT_RENEG_WINDOW);
        t.end();
    });


    t.test('has SLAB_BUFFER_SIZE', function (t) {
        var config = shim({ 'tls': { SLAB_BUFFER_SIZE: 1 } });
        env.tls(config);
        t.equal(tls.SLAB_BUFFER_SIZE, 1);
        t.equal(tls.CLIENT_RENEG_LIMIT, defaults.CLIENT_RENEG_LIMIT);
        t.equal(tls.CLIENT_RENEG_WINDOW, defaults.CLIENT_RENEG_WINDOW);
        t.end();
    });


    t.test('has CLIENT_RENEG_LIMIT', function (t) {
        var config = shim({ 'tls': { CLIENT_RENEG_LIMIT: 1 } });
        env.tls(config);
        t.equal(tls.SLAB_BUFFER_SIZE, 1);
        t.equal(tls.CLIENT_RENEG_LIMIT, 1);
        t.equal(tls.CLIENT_RENEG_WINDOW, defaults.CLIENT_RENEG_WINDOW);
        t.end();
    });


    t.test('has CLIENT_RENEG_WINDOW', function (t) {
        var config = shim({ 'tls': { CLIENT_RENEG_WINDOW: 1 } });
        env.tls(config);
        t.equal(tls.SLAB_BUFFER_SIZE, 1);
        t.equal(tls.CLIENT_RENEG_LIMIT, 1);
        t.equal(tls.CLIENT_RENEG_WINDOW, 1);
        t.end();
    });


    t.on('end', function () {
        Object.keys(defaults).forEach(function (prop) {
            tls[prop] = defaults[prop];
        });
    });

});


test('resolvePort', function (t) {

    t.test('no port', function (t) {
        var config, port;
        config = shim();
        port = env.resolvePort(config);
        t.notOk(port);
        t.end();
    });


    t.test('number', function (t) {
        var config, port;
        config = shim({ port: 8000 });
        port = env.resolvePort(config);
        t.equal(port, 8000);
        t.end();
    });


    t.test('string', function (t) {
        var config, port;
        config = shim({ port: 'NODE_PORT', NODE_PORT: 8000 });
        port = env.resolvePort(config);
        t.equal(port, 8000);
        t.end();
    });


    t.test('array', function (t) {
        var config, port;
        config = shim({ port: ['NODE_PORT', 'ANOTHER_ENV', 8001], NODE_PORT: undefined, ANOTHER_ENV: 8000 });
        port = env.resolvePort(config);
        t.equal(port, 8000);
        t.end();
    });


    t.test('array with fallback', function (t) {
        var config, port;
        config = shim({ port: ['NODE_PORT', 'ANOTHER_ENV', 8000], NODE_PORT: undefined, ANOTHER_ENV: undefined });
        port = env.resolvePort(config);
        t.equal(port, 8000);
        t.end();
    });

});


test('resolveHost', function (t) {

    t.test('port is string', function (t) {
        var config, host;
        config = shim({ port: 'NODE_PORT', NODE_PORT: '/tmp/descriptor' });
        host = env.resolveHost(config);
        t.notOk(host);
        t.end();
    });


    t.test('no host', function (t) {
        var config, host;
        config = shim();
        host = env.resolveHost(config);
        t.notOk(host);
        t.end();
    });


    t.test('array', function (t) {
        var config, host;
        config = shim({ host: ['NODE_HOST', 'ANOTHER_ENV'], NODE_PORT: undefined, ANOTHER_ENV: '127.0.0.1' });
        host = env.resolveHost(config);
        t.equal(host, '127.0.0.1');
        t.end();
    });


    t.test('array without value', function (t) {
        var config, host;
        config = shim({ port: ['NODE_PORT', 'ANOTHER_ENV'], NODE_PORT: undefined, ANOTHER_ENV: undefined });
        host = env.resolvePort(config);
        t.notOk(host);
        t.end();
    });

});