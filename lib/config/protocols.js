'use strict';

var fs = require('fs'),
    path = require('path'),
    shortstop = require('shortstop');


function createPathHandler(basedir) {
    return function file(file) {
        if (path.resolve(file) === file) {
            // Absolute path already, so just return it.
            return file;
        }
        file = file.split('/');
        file.unshift(basedir);
        return path.resolve.apply(path, file);
    };
}


function createFileHandler(basedir) {
    var pathHandler = createPathHandler(basedir);
    return function fileHandler(file) {
        file = pathHandler(file);
        return fs.readFileSync(file);
    };
}


function base64Handler(value) {
    return new Buffer(value, 'base64');
}



exports.create = function create(basedir) {
    var protocols;
    protocols = shortstop.create();
    protocols.use('file', createFileHandler(basedir));
    protocols.use('path', createPathHandler(basedir));
    protocols.use('base64', base64Handler);
    return protocols;
};