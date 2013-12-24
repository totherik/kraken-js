'use strict';

var States = {
    CONNECTED: 0,
    DISCONNECTED: 1,
    DISCONNECTING: 2
};

module.exports = function (config) {
    var state, template, timeout, server;

    state = States.CONNECTED;
    template = config.template;
    timeout = config.timeout;

    function shutdown() {
        var ok, err;

        ok = process.exit.bind(process, 0);
        err = process.exit.bind(process, 1);
        state = States.DISCONNECTING;

        if (server) {
            server.close(ok);
            setTimeout(err, timeout);
            return;
        }

        ok();
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);


    return function (req, res, next) {

        function json() {
            res.send('Server is shutting down.');
        }

        function html() {
            template ? res.render(template) : json();
        }

        if (state === States.DISCONNECTING) {
            res.status(503);
            res.setHeader('Connection', 'close');
            res.format({
                html: html,
                json: json
            });
            return;
        }

        server = server || req.app.server;
        next();

    };

};