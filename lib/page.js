const _utils = require('./_utils');
const callbackOrDummy = _utils.callbackOrDummy;
const promisify = require('bluebird').promisify;
const pageExtras = require('./page_extras');

let pageMethods = {
	    setFn: setFn,
	    get: get,
	    set: set,
	    evaluate: evaluate
	},
	allMethods = [
		'addCookie',
		'childFramesCount',
		'childFramesName',
		'clearCookies',
		'close',
	    'currentFrameName',
		'deleteCookie',
		'evaluateJavaScript',
	    'evaluateAsync',
		'getPage',
		'go',
		'goBack',
		'goForward',
		'includeJs',
	    'injectJs',
		'open',
		'openUrl',
		'release',
		'reload',
		'render',
		'renderBase64',
	    'sendEvent',
		'setContent',
		'stop',
		'switchToFocusedFrame',
		'switchToFrame',
		'switchToChildFrame',
		'switchToMainFrame',
	    'switchToParentFrame',
		'uploadFile',
	];

function Page(id, request_queue, poll_func) {
    this.id = id;
    this.request_queue = request_queue;
    this.poll_func = poll_func;
}

_utils.copy(pageMethods, Page.prototype, promisify);

_utils.copy(pageExtras, Page.prototype);

allMethods.forEach(method => {
    Page.prototype[method] = promisify(pageMethod);

    function pageMethod() {
        let args = Array.prototype.slice.call(arguments),
        	callback = null,
			req_params = [this.id, method].concat(args);
        if (args.length > 0 && typeof args[args.length - 1] === 'function')
            callback = args.pop();
        this.request_queue.push([req_params, callbackOrDummy(callback, this.poll_func)]);
    }
});

function setFn(name, fn, cb) {
    this.request_queue.push([[this.id, 'setFunction', name, fn.toString()], callbackOrDummy(cb, this.poll_func)]);
}

function get(name, cb) {
    this.request_queue.push([[this.id, 'getProperty', name], callbackOrDummy(cb, this.poll_func)]);
}

function set(name, val, cb) {
    this.request_queue.push([[this.id, 'setProperty', name, val], callbackOrDummy(cb, this.poll_func)]);
}

function evaluate(fn) {
    let extra_args = [],
    	cb = arguments[arguments.length - 1];
    if (arguments.length > 2) {
        extra_args = Array.prototype.slice.call(arguments, 1, -1);
    }
    this.request_queue.push([[this.id, 'evaluate', fn.toString()].concat(extra_args), callbackOrDummy(cb, this.poll_func)]);
}

module.exports = Page;
