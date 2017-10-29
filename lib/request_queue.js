const http = require('http');
const Queue = require('./queue');

module.exports = function(phantom, port) {
    return new Queue((paramarr, next) => {
		phantom.POSTING = true;

        let params = paramarr[0],
	        callback = paramarr[1],
	        page = params[0],
	        method = params[1],
	        args = params.slice(2),
			json = JSON.stringify({page: page, method: method, args: args});
	        http_opts = {
	            hostname: '127.0.0.1',
	            port: port,
	            path: '/',
	            method: 'POST',
	        },
			req = http.request(http_opts, res => {
				let data = '',
	            	err = res.statusCode == 500 ? true : false;
	            res.setEncoding('utf8');
	            res.on('data', chunk => {
	                data += chunk;
	            });
	            res.on('end', () => {
	                phantom.POSTING = false;
	                if (!data) {
	                    next();
	                    return callback('No response body for page.' + method + '()');
	                }
	                let results = JSON.parse(data);

	                if (err) {
	                    next();
	                    return callback(results);
	                }

	                next();
	                callback(null, results);
	            });
	        });

        req.on('error', err => {
            console.warn('Request() error evaluating ' + method + '() call: ' + err);
            callback('Request() error evaluating ' + method + '() call: ' + err);
        });

        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Content-Length', Buffer.byteLength(json));
        req.write(json);
        req.end();
    });
};
