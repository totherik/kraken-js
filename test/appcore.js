'use strict';

var test = require('tape'),
    path = require('path'),
    appcore = require('../lib/appcore');


test('appcore#create', function (t) {

    t.test('factory with callback', function (t) {

        appcore.create(__dirname, {}, function (err, app) {
            t.error(err);
            t.equal(typeof app, 'function');
            t.equal(typeof app.handle, 'function');
            t.equal(typeof app.set, 'function');
            t.end();
        });

    });


    t.test('factory with promise', function (t) {

        appcore.create(__dirname, {}).then(function (app) {
            t.equal(typeof app, 'function');
            t.equal(typeof app.handle, 'function');
            t.equal(typeof app.set, 'function');
        }).catch(function (err) {
            t.error(err);
        }).finally(function () {
            t.end();
        });

    });


    t.test('factory with callback error', function (t) {

        appcore.create(path.resolve(__dirname, 'fixtures'), {}, function (err) {
            t.ok(err);
            t.end();
        });

    });


    t.test('factory with promise error', function (t) {

        appcore.create(path.resolve(__dirname, 'fixtures'), {}).then(function () {
            t.error(new Error('Creation should have failed.'));
        }).catch(function (err) {
            t.ok(err);
        }).finally(function () {
            t.end();
        });

    });

});