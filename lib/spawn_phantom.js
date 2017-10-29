const child_process = require('child_process')
const path = require('path')
const spawn = child_process.spawn
const exec = child_process.exec
const util = require('util')
const Promise = require('bluebird');

function spawnPhantom(options, callback) {
    options.phantomPath = options.phantomPath || 'phantomjs';
    options.parameters = options.parameters || {};

    let args = [],
		exitCode = 0,
		closeChild = () => {
	        try {
	            phantom.kill();
	        } catch(e) {}
	        process.exit(1);
	    },
		uncaughtHandler = err => {
	        console.error(err.stack);
	        closeChild();
	    };

    for (let param in options.parameters) {
        args.push('--' + param + '=' + options.parameters[param]);
    }
    args.push(__dirname + path.sep + 'bridge.js');

    let phantom = spawn(options.phantomPath, args);

    ['SIGINT', 'SIGTERM'].forEach(sig => {
        process.on(sig, closeChild);
    });

    process.on('uncaughtException', uncaughtHandler);

    phantom.once('error', err => {
        callback(err);
    });

    phantom.stderr.on('data', data => {
        if (options.ignoreErrorPattern && options.ignoreErrorPattern.exec(data)) {
            return;
        }
        return console.warn('phantom stderr: ' + data);
    });

    phantom.once('exit', code => {
        ['SIGINT', 'SIGTERM'].forEach(sig => {
            process.removeListener(sig, closeChild);
        });
        process.removeListener('uncaughtException', uncaughtHandler);
        exitCode = code;
    });

    phantom.stdout.once('data', data => {
        phantom.stdout.on('data', data => {
            return console.log('phantom stdout: ' + data);
        });

        let matches = data.toString().match(/Ready \[(\d+)\]/);
        if (!matches) {
            phantom.kill();
            return callback('Unexpected output from PhantomJS: ' + data);
        }

        let phantom_pid = parseInt(matches[1], 0),
        	platform = require('os').platform(),
	        cmd = null;

        switch (platform) {
            case 'linux':
                cmd = 'netstat -nlp | grep "[[:space:]]%d/"';
                break;
            case 'darwin':
                cmd = 'lsof -p %d | grep LISTEN';
                break;
            case 'win32':
                cmd = 'netstat -ano | findstr /R "\\<%d\\>"';
                break;
            case 'cygwin':
                cmd = 'netstat -ano | grep %d';
                break;
            case 'freebsd':
                cmd = 'sockstat | grep %d';
                break;
            default:
                phantom.kill();
                return callback('Your OS is not supported yet. Tell us how to get the listening port based on PID');
        }

        exec(util.format(cmd, process.pid), (err, stdout, stderr) => {
            if (err !== null) {
                stdout = '';
            }
            let re = /(?:127\.0\.0\.1|localhost):(\d+)/ig, match,
            	ports = [],
				phantom_pid_command = util.format(cmd, phantom_pid);

            while (match = re.exec(stdout)) {
                ports.push(match[1]);
            }

            exec(phantom_pid_command, (err, stdout, stderr) => {
				let port;
                if (err !== null) {
                    phantom.kill();
                    return callback('Error executing command to extract phantom ports: ' + err);
                }

                while (match = re.exec(stdout)) {
                    if (ports.indexOf(match[1]) === -1) {
                        port = match[1];
                    }
                }

                if (!port) {
                    phantom.kill();
                    return callback('Error extracting port from: ' + stdout);
                }

                callback(null, [phantom, port]);
            });
        });
    });

    setTimeout(() => {
        if (exitCode !== 0) {
            return callback('Phantom immediately exited with: ' + exitCode);
        }
    }, 100);
};

module.exports = Promise.promisify(spawnPhantom);
