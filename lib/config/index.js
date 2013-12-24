'use strict';

var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    shush = require('shush'),
    protocols = require('./protocols'),
    debug = require('debuglog')('kraken/config');


var ENV = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


function initEnv(config) {
    var env;

    env = config.get('NODE_ENV') || 'development';
    config.set('NODE_ENV', env);
    config.set('env:env', env);
    config.set('env:' + env, true);

    // Setup environment convenience properties
    Object.keys(ENV).forEach(function (key) {
        config.set('env:' + key, !!env.match(ENV[key]));
    });

    return config;
}


function enumerateFiles(env, options) {
    var ext, files;

    ext = '.json';
    files = [];

    options.basedirs.forEach(function (basedir) {
        options.filenames.forEach(function (filename) {
            files.push(path.join(basedir, filename + '-' + env + ext));
            files.push(path.join(basedir, filename + ext));
        });
    });

    return files;
}


exports.create = function (basedir, fileOptions) {
    var config, handler;

    // Init backing store
    config = initEnv(nconf.argv().env().use('memory'));
    handler = protocols.create(basedir);

    // Load each file
    enumerateFiles(config.get('env:env'), fileOptions).forEach(function (file) {
        var data;

        if (fs.existsSync(file)) {
            data = shush(file);

            debug('loading config file ', file);
            config.use(file, {
                type: 'literal',
                store: handler.resolve(data)
            });
        }
    });

    return {
        get: config.get.bind(config),
        set: config.set.bind(config)
    };
};