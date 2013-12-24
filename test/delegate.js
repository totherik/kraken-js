'use strict';

var test = require('tape'),
    nconf = require('nconf'),
    express = require('express'),
    kraken = require('../index');


function reset() {
    nconf.reset();
}

test('delegate', function (t) {

    t.test('errors', function (t) {
        var delegate = {
            configure: function (config, callback) {
                callback(new Error('Fail.'));
            }
        };

        kraken.create(delegate).listen(function (err) {
            t.ok(err instanceof Error);
            t.ok(err.message, 'Fail.');
            t.end();
        });

        t.on('end', reset);
    });


    t.test('configure', function (t) {
        var delegate, child, parent;

        delegate = {
            configure: function (config, callback) {
                config.set('port', 8001);
                config.set('express:x-powered-by', false);
                config.set('express:views', './foo/bar');
                callback(null, config);
            }
        };

        child = express();
        parent = kraken.create(delegate).use('/foo', child);
        parent.listen().then(function (server) {

            t.equal(parent.app.get('views'), './foo/bar', 'parent app should be configured');
            t.equal(parent.app.get('views'), child.get('views'), 'child app should inherit parent `views` setting');
            t.equal(parent.app.get('x-powered-by'), child.get('x-powered-by'), 'child app should inherit parent `x-powered-by` setting');

            t.equal(server.address().port, 8001, 'server should be bound to correct port');
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

        t.on('end', reset);
    });


    t.test('configure with no express defaults', function (t) {

        kraken.create().listen(function (err, server) {
            t.error(err);
            t.ok(server);
            server.close(t.end.bind(t));
        });

        t.on('end', reset);

    });


    t.test('requestStart', function (t) {
        var invoked, delegate;

        invoked = false;
        delegate = {
            requestStart: function (app) {
                t.ok(app);
                t.equal(typeof app.handle, 'function');
                t.equal(typeof app.set, 'function');
                invoked = true;
            }
        };

        kraken.create(delegate).listen(function (err, server) {
            t.error(err);
            t.ok(invoked);
            t.ok(server);
            server.close(t.end.bind(t));
        });

        t.on('end', reset);
    });


    t.test('requestBeforeRoute', function (t) {
        var invoked, delegate;

        invoked = false;
        delegate = {
            requestBeforeRoute: function (app) {
                t.ok(app);
                t.equal(typeof app.handle, 'function');
                t.equal(typeof app.set, 'function');
                invoked = true;
            }
        };

        kraken.create(delegate).listen(function (err, server) {
            t.error(err);
            t.ok(invoked);
            t.ok(server);
            server.close(t.end.bind(t));
        });

        t.on('end', reset);
    });


    t.test('requestAfterRoute', function (t) {
        var invoked, delegate;

        invoked = false;
        delegate = {
            requestAfterRoute: function (app) {
                t.ok(app);
                t.equal(typeof app.handle, 'function');
                t.equal(typeof app.set, 'function');
                invoked = true;
            }
        };

        kraken.create(delegate).listen(function (err, server) {
            t.error(err);
            t.ok(invoked);
            t.ok(server);
            server.close(t.end.bind(t));
        });

        t.on('end', reset);
    });

});