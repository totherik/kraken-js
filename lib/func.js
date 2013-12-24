'use strict';

var slice = Function.prototype.call.bind(Array.prototype.slice);

exports.fork = function fork(task, complete) {
    return function (err) {
        var result;

        if (err) {
            complete(err);
            return;
        }

        result = task.apply(null, slice(arguments, 1));
        complete(null, result);
    }
};