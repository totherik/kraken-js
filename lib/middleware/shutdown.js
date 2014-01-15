'use strict';

var States = {
    CONNECTED: 0,
    DISCONNECTING: 2
};


module.exports = function (config) {
    var state, template, timeout, app;

    function close() {
        state = States.DISCONNECTING;
        app.emit('shutdown', timeout);
    }

    state = States.CONNECTED;
    template = config.template;
    timeout = config.timeout || 10 * 1000;

    return function shutdown(req, res, next) {

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
                json: json,
                html: html
            });
            return;
        }

        if (!app) {
            // Lazy-bind - only attempt clean shutdown
            // if we've taken at least one request.
            app = req.app;
            process.once('SIGTERM', close);
            process.once('SIGINT', close);
        }

        next();

    };

};