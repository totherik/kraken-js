'use strict';

module.exports = function (app) {
    app.get('/', function (req, res) {

        function alert(type) {
            console.log(type);
        }

        res.on('finish', alert.bind(null, 'finish'));
        res.on('close', alert.bind(null, 'close'));

        setTimeout(function () {
            res.render('index', { name: 'world' });
        }, 2500);
    });

    app.post('/upload', function (req, res) {
        console.log(req.body);
        console.log(req.files);
        res.send('ok');
    })
};