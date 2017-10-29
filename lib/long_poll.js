const http = require('http');
const _utils = require('./_utils');
const callbackOrDummy = _utils.callbackOrDummy;
const unwrapArray = _utils.unwrapArray;
const wrapArray = _utils.wrapArray;

module.exports = function(phantom, port, pages, setup_new_page) {
	let POLL_INTERVAL = process.env.POLL_INTERVAL || 500,
		http_opts = {
	        hostname: '127.0.0.1',
	        port: port,
	        path: '/',
	        method: 'GET',
	    },
	    dead = false;

	function repeater() {
		setTimeout(() => {
			poll_func(repeater);
		}, POLL_INTERVAL);
	}

	function poll_func(cb) {
        if (dead) return cb('Phantom Process died');
        if (phantom.POSTING) return cb();

        let req = http.get(http_opts, res => {
			let data = '';

            res.setEncoding('utf8');

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
				let results = [];

                if (dead) return cb('Phantom Process died');

                try {
                    results = JSON.parse(data);
                }
                catch (err) {
                    console.warn("Error parsing JSON from phantom: " + err);
                    console.warn("Data from phantom was: " + data);
                    return cb("Error parsing JSON from phantom: " + err
                            + "\nData from phantom was: " + data);
                }

                results.forEach(r => {
                    if (r.page_id) {
                        let page = pages[r.page_id];
                        if (page && r.callback === 'onPageCreated') {
                            let child_page = setup_new_page(r.args[0]);
                            if (page.onPageCreated) {
                                page.onPageCreated(child_page);
                            }
                        } else if (page && page[r.callback]) {
                            let callbackFunc = page[r.callback];
                            if (callbackFunc.length > 1) {
                                callbackFunc.apply(page, wrapArray(r.args));
                            } else {
                                callbackFunc.call(page, unwrapArray(r.args));
                            }
                        }
                    } else {
                        let cb = callbackOrDummy(phantom[r.callback]);
                        cb.apply(phantom, r.args);
                    }
                });

                cb();
            });
        });

        req.on('error', err => {
            if (dead || phantom.killed) return;
            console.warn("Poll Request error: " + err);
        });
    }

	phantom.once('exit', () => {
		dead = true;
	});

    repeater();

	return poll_func;
};
