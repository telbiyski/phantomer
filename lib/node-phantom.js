const spawnPhantom = require('./spawn_phantom');
const longPoll = require('./long_poll');
const requestQueue = require('./request_queue');
const PhantomProxy = require('./phantom_proxy');
const Page = require('./page');

module.exports.create = function (options) {
    options = options || {};

    return spawnPhantom(options)
    .spread((phantom, port) => {
        let pages = {},
	        request_queue = requestQueue(phantom, port),
	        poll_func = longPoll(phantom, port, pages, setup_new_page),
	        proxy = new PhantomProxy(phantom, request_queue, poll_func, setup_new_page);

        return proxy;

        function setup_new_page(id) {
            let page = new Page(id, request_queue, poll_func);
            pages[id] = page;
            return page;
        }
    });
}
