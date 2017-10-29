function callbackOrDummy (callback, poll_func) {
    if (!callback) return function () {};
    if (poll_func) {
        return function () {
            let args = Array.prototype.slice.call(arguments);
            poll_func(function (err) {
                if (err) {
                    callback(err)
                } else {
                    callback.apply(null, args);
                }
            });
        }
    }
    else {
        return callback;
    }
}

function unwrapArray (arr) {
    return arr && arr.length == 1 ? arr[0] : arr
}

function wrapArray(arr) {
    return (arr instanceof Array) ? arr : [arr];
}

function copy(o, to, func) {
    func = func || identity;
    to = to || {};
    for (let key in o) to[key] = func(o[key]) ;
    return to;
}

function identity(x) {
    return x;
}

module.exports = {
    callbackOrDummy: callbackOrDummy,
    unwrapArray: unwrapArray,
    wrapArray: wrapArray,
    copy: copy
};
