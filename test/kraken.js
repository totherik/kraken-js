'use strict';

var fs = require('fs'),
    test = require('tape'),
    path = require('path'),
    express = require('express'),
    kraken = require('../index');



test('kraken.create', function (t) {

    t.test('create', function (t) {
        var k = kraken.create();
        t.equal(typeof k, 'object', 'kraken creates an object');
        t.equal(typeof k.use, 'function');
        t.equal(typeof k.listen, 'function');
        t.end();
    });

});


test('kraken.isKraken', function (t) {

    t.test('with kraken object', function (t) {
        var k = kraken.create();
        t.ok(kraken.isKraken(k));
        t.end();
    });


    t.test('without kraken object', function (t) {
        t.notOk(kraken.isKraken({}));
        t.end();
    });

});


test('kraken.use', function (t) {

    t.test('`use` with promise', function (t) {
        var childA, childB, parent;

        childA = express();
        childB = express();

        parent = kraken.create()
            .use(childA)
            .use('/foo', childB);

        parent.listen().then(function (server) {

            t.equal(parent.app, childA.parent, 'childA was added to parent app');
            t.equal(parent.app, childB.parent, 'childB was added to parent app');

            t.equal(typeof server, 'object', 'kraken returns a server');
            server.close(t.end.bind(t));

        }).catch(function (err) {
                t.error(err);
                t.end();
            });
    });


    t.test('`use` with callback', function (t) {
        var childA, childB, parent;

        childA = express();
        childB = express();

        parent = kraken.create()
            .use(childA)
            .use('/foo', childB);

        parent.listen(function (err, server) {
            t.error(err);
            t.equal(parent.app, childA.parent, 'childA added to parent app');
            t.equal(parent.app, childB.parent, 'childB added to parent app');

            t.equal(typeof server, 'object', 'kraken returns a server');
            server.close(t.end.bind(t));
        });
    });

});


test('kraken.listen', function (t) {

    t.test('sets root', function (t) {

        var k = kraken.create();
        k.listen().then(function (server) {

            t.equal(k.app.get('basedir'), __dirname);
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

    });


    t.test('`listen` with promise', function (t) {

        kraken.create().listen().then(function (server) {

            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address().address, '0.0.0.0');
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

    });


    t.test('`listen` port and promise', function (t) {

        kraken.create().listen(8000).then(function (server) {

            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address().address, '0.0.0.0');
            t.equal(server.address().port, 8000);
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

    });


    t.test('`listen` with port and callback', function (t) {

        kraken.create().listen(8000, function (err, server) {

            t.error(err);
            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address().address, '0.0.0.0', 'server should be bound to correct host');
            t.equal(server.address().port, 8000, 'server should be bound to correct port');
            server.close(t.end.bind(t));

        });

    });


    t.test('`listen` port and host and promise', function (t) {

        kraken.create().listen(8000, 'localhost').then(function (server) {

            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address().address, '127.0.0.1', 'server should be bound to correct host');
            t.equal(server.address().port, 8000, 'server should be bound to correct port');
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

    });


    t.test('`listen` with port and host and callback', function (t) {

        kraken.create().listen(8000, 'localhost', function (err, server) {

            t.error(err);
            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address().address, '127.0.0.1', 'server should be bound to correct host');
            t.equal(server.address().port, 8000, 'server should be bound to correct port');
            server.close(t.end.bind(t));

        });

    });


    t.test('`listen` with file descriptor and promise', function (t) {

        kraken.create().listen('/tmp/kraken').then(function (server) {

            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address(), '/tmp/kraken', 'server should be bound to a file descriptor');
            server.close(t.end.bind(t));

        }).catch(function (err) {
            t.error(err);
            t.end();
        });

    });


    t.test('`listen` with file descriptor and callback', function (t) {

        kraken.create().listen('/tmp/kraken', function (err, server) {

            t.error(err);
            t.equal(typeof server, 'object', 'kraken returns a server');
            t.equal(server.address(), '/tmp/kraken', 'server should be bound to a file descriptor');
            server.close(t.end.bind(t));

        });

    });


    t.test('listen failure', function (t) {

        kraken.create().listen(80).then(function (server) {
            t.fail('listen should not have succeeded.');
            server.close(t.end.bind(t));
        }).catch(function (err) {
            t.ok(err instanceof Error);
            t.end();
        });

    });

});



test('tls', function (t) {

    t.test('https', function (t) {
        var delegate = {
            configure: function (config, callback) {
                config.set('tls', {
                    key: fs.readFileSync(path.join(__dirname, './fixtures/tls/key.pem')),
                    cert: fs.readFileSync(path.join(__dirname, './fixtures/tls/cert.pem'))
                });
                callback(null, config);
            }
        };

        kraken.create(delegate).listen(8443).then(function (server) {
            t.equal(typeof server, 'object');
            server.close(t.end.bind(t));
        }).catch(function (err) {
            t.error(err);
            t.end();
        });
    });

});