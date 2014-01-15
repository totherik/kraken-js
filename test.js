'use strict';

var path = require('path'),
    kraken = require('./index');


var app;
app = kraken('app');
app.onconfig = function (fn) {
    app.set('middleware:router:arguments', [{ directory: path.resolve('./test/controllers') }]);
    app.set('express:views',  path.resolve('./test/public/templates') );
    fn();
};

app.on('error', function (err) {
    console.log(err.stack);
});

app.on('listening', function () {
    console.log('listening', app._server.address());
});

app.listen();