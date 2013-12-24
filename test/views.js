//'use strict';
//
//var test = require('tape'),
//    kraken = require('../index');
//
//
//test('no view engine', function (t) {
//
//    var delegate = {
//        configure: function (config, callback) {
//            config.set('express:view engine', null);
//            callback(null, config);
//        }
//    };
//
//
//    t.test('send/end', function (t) {
//
//        t.fail(new Error('Not Implemented'));
//        t.end();
//
//    });
//
//
//    t.test('json', function (t) {
//
//        t.fail(new Error('Not Implemented'));
//        t.end();
//
//    });
//
//
//    t.test('render failure', function (t) {
//
//        t.fail(new Error('Not Implemented'));
//        t.end();
//
//    });
//
//});
