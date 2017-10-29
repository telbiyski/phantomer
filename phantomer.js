/*
 Phantomer v1.0.6
 (c) 2016-2017 Petar Telbiyski. https://github.com/telbiyski
 License: MIT
*/

const phantom = require('./lib/node-phantom');
const defaults = require('defaults');
const Promise = require('bluebird');

module.exports = function(options) {
	let self = this,
		browser = null,
		tab = null;

	options = options || {};
	options.timeout = options.timeout || 1500;
	options.interval = options.interval || 150;
	options.max_tries = options.max_tries || 10;
	options.retry = {max_tries: options.max_tries, timeout: options.timeout, interval: options.interval};

	function addCookies(cookies) {
		return new Promise((resolve, reject) => {
			let totalCookies = cookies.length,
				cookiesAdded = 0;
			if (totalCookies) {
				for (let i = 0; i < totalCookies; i++) {
					(cookie => {
						return browser.addCookie(cookie)
						.then(() => {
							if (++cookiesAdded == totalCookies) {
								resolve();
							}
						}, reject);
					})(cookies[i]);
				}
			} else {
				resolve();
			}
		});
	}

	function pager() {
		return new Promise((resolve, reject) => {
			return browser.createPage()
			.then(page => {
				return page.get('settings')
				.then(settings => {
                    if (options.settings) {
                        settings = options.settings;
                    } else {
                        settings.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
                    }
					if (options.auth) {
						page.set('customHeaders', options.auth);
					}
					page.set('viewportSize', {width: options.browserWidth || 1920, height: options.browserHeight || 1050});
					page.set('settings', settings)
					.then(() => {
						tab = page;
						tab.onTimeout = () => {
							console.log('Phantom Page Timeout');
						};
						tab.onLoadFinished = () => {
							self.waitingForNextPage = false;
							if (tab.onLoadFinished2) tab.onLoadFinished2();
						};
						if (self.cokies) {
							return addCookies(self.cookies)
							.then(() => {
								resolve(page);
							}, reject)
						} else {
							resolve(page);
						}
					}, reject);
				}, reject);
			}, e => {
				reject(e);
			})
			.catch(reject);
		});
	}

	function prepare() {
		return new Promise((resolve, reject) => {
			let opts = {parameters: options.parameters};
			if (options.phantomPath) {
				opts.phantomPath = options.phantomPath;
			}
			return phantom.create(opts)
			.then(instance => {
				if (instance) {
					browser = instance;
					return pager().then(resolve, reject);
				} else {
					reject('Phantom spawn error');
				}
			}, err => {
				reject(err);
			});
		});
	}

	function val(selector, value) {
		if (typeof value === 'undefined') {
			return tab.evaluate(function(selector) {
				return document.querySelector(selector).value;
			}, selector);
		} else {
			return tab.evaluate(function(selector, value) {
				var element = document.querySelector(selector);
				if (element) {
					var event = document.createEvent('HTMLEvents');
					element.value = value;
					event.initEvent('change', true, false);
					element.dispatchEvent(event);
				}
			}, selector, value);
		}
	}

	function timeoutCB(err) {
		if (err === 'Timeout occurred before url changed.') {
			if (typeof tab.onTimeout === 'function') {
				tab.onTimeout();
			}
		}
	}

	self.open = url => {
		return prepare()
		.then(() => {
			return tab.open(url);
		}, e => {
			return Promise.reject();
		});
	};

	self.goTo = url => {
		return tab.open(url);
	};

	self.newPage = url => {
		return tab.get('cookies')
		.then(c => {
			self.cokies = c;
			return tab.close();
		})
		.then(() => {
			return pager();
		})
		.then(() => {
			return tab.open(url);
		});
	};

	self.title = () => {
		return tab.get('title');
	};

	self.injectJQ = (jqueryURL) => {
		jqueryURL = jqueryURL || '//code.jquery.com/jquery-3.2.1.min.js';
		return tab.evaluate(function(jqueryURL) {
			window.jQuery = undefined;
			window.$ = undefined;
			(function() {
				function l(u, i) {
			        var d = document;
			        if (!d.getElementById(i)) {
			            var s = d.createElement('script');
			            s.src = u;
			            s.id = i;
			            d.body.appendChild(s);
			        }
			    }
			    l(jqueryURL, 'jquery')
			})();
		}, jqueryURL)
		.then(() => {
			return self.wait(300);
		});
	};

	self.close = () => {
		if (browser) {
			return browser.exit();
		} else {
			return Promise.reject();
		}
	};

	self.headers = headers => {
		return tab.set('customHeaders', headers);
	};

	self.back = () => {
		return tab.goBack();
	};

	self.forward = () => {
		return tab.goForward();
	};

	self.authentication = (user, password) => {
		return tab.get('settings')
		.then(settings => {
			settings.userName = user;
			settings.password = password;
			return tab.set('settings', settings);
		});
	};

	self.viewport = (width, height) => {
		let viewport = {
			width: width,
			height: height
		};
		if (!width) {
			return tab.evaluate(function() {
				return {
					width: window.innerWidth,
					height: window.innerHeight
				};
			});
		} else {
			return tab.set('viewportSize', viewport);
		}
	};

	self.zoom = zoomFactor => {
		return tab.set('zoomFactor', zoomFactor);
	};

	self.plainText = () => {
		return tab.get('plainText');
	};

	self.scrollTo = (top, left) => {
		let position = {
			top: top,
			left: left
		};
		return tab.set('scrollPosition', position);
	};

	self.post = (url, postData) => {
		return tab.open(url, 'POST', postData);
	};

	self.reload = () => {
		return tab.evaluate(function() {
			document.location.reload(true);
		});
	};

	self.cookies = arg => {
		if (arg) {
			if (arg instanceof Array) {
				return browser.clearCookies()
				.then(() => {
					return addCookies(arg);
				});
			} else if (typeof arg === 'object') {
				return browser.addCookie(arg);
			}
		} else {
			return tab.get('cookies');
		}
	};

	self.screenshot = path => {
		return tab.render(path);
	};

	self.clickSelector = selector => {
		return tab.evaluate(function(selector) {
			var element = document.querySelector(selector);
			var event = document.createEvent('MouseEvent');
			event.initEvent('click', true, false);
			if (element) element.dispatchEvent(event);
		}, selector);
	};

	self.click = selector => {
		return tab.clickSelector(selector, 'left', options.retry);
	};

	self.boundingRectangle = selector => {
		return tab.evaluate(function(selector) {
			var element = document.querySelector(selector);
			return element ? element.getBoundingClientRect() : undefined;
		}, selector);
	};

	self.crop = (area, path) => {
		function doCrop(rect) {
			return tab.get('clipRect')
			.then(prevClipRect => {
				return tab.set('clipRect', rect);
			}, reject)
			.then(() => {
				return tab.render(path);
			}, reject)
			.then(() => {
				return tab.set('clipRect', prevClipRect);
			}, reject);
		}
		if (typeof area === 'string') {
			return self.boundingRectangle(area).then(doCrop);
		} else {
			return doCrop(area);
		}
	};

	self.clip = rect => {
		return tab.set('clipRect', rect);
	};

	self.screenshotBase64 = type => {
		return new Promise((resolve, reject) => {
			if (['PNG', 'GIF', 'JPEG'].indexOf(type) === -1) {
				reject('screenshotBase64 type must be PNG, GIF, or JPEG.');
			} else {
				return tab.renderBase64(type);
			}
		});
	};

	self.pdf = (path, paperSize = {format: 'A4', orientation: 'portrait', margin: '0.5in'}) => {
		return tab.set('paperSize', paperSize)
		.then(() => {
			return tab.render(path, {format:'pdf', quality:'100'});
		});
	};

	self.injectJs = file => {
		return tab.injectJs(file);
	};

	self.includeJs = url => {
		return tab.includeJs(url);
	};

	self.value = (selector, value) => {
		return val(selector, value);
	};

	self.clear = selector => {
		return val(selector, '');
	};

	self.keyboardEvent = (type = 'keypress', key = null, modifier = 0) => {
		return tab.sendEvent(type, key, null, null, modifier);
	};

	self.mouseEvent = (type = 'click', x = null, y = null, button = 'left') => {
		return tab.sendEvent(type, x, y, button);
	};

	self.type = (selector, text, options) => {
		function computeModifier(modifierString) {
			let modifiers = {
				ctrl: 0x04000000,
				shift: 0x02000000,
				alt: 0x08000000,
				meta: 0x10000000,
				keypad: 0x20000000
			};
			let modifier = 0,
				checkKey = key => {
					if (key in modifiers) return;
				};
			if (!modifierString) return modifier;
			let keys = modifierString.split('+');
			keys.forEach(checkKey);
			return keys.reduce((acc, key) => {
				return acc | modifiers[key];
			}, modifier);
		}
		let DEFAULTS = {
			reset: false,
			eventType: 'keypress',
			keepFocus: false
		},
			modifiers = computeModifier(options && options.modifiers),
			opts = defaults(options || {}, DEFAULTS);
		return new Promise((resolve, reject) => {
			return tab.evaluate(function(selector) {
				if (document.querySelector(selector)) document.querySelector(selector).focus();
			}, selector)
			.then(() => {
				let hitEnter = false;
				if (text.indexOf('ENTER') > -1) {
					hitEnter = true;
					text = text.replace('ENTER', '');
				}
				for (let i = 0, len = text.length; i < len; i++) {
					tab.sendEvent(opts.eventType, text[i], null, null, modifiers);
				}
				if (hitEnter) {
					tab.sendEvent('keypress', 16777221);
				}
				resolve();
			});
		});
	};

	self.upload = (selector, path) => {
		return tab.uploadFile(selector, path);
	};

	self.setProxy = (ip, port, type, user, pass) => {
		return browser.setProxy(ip, port, type, user, pass);
	};

	self.do = fn => {
		return new Promise((resolve, reject) =>{
			fn(resolve);
		});
	};

	self.evaluate = function() {
		let args = Array.prototype.slice.call(arguments);
		return tab.evaluate.apply(tab, args);
	};

	self.url = () => {
		return tab.evaluate(function() {
			return document.location.href;
		});
	};

	self.count = selector => {
		return tab.evaluate(function(selector) {
			return document.querySelectorAll(selector).length;
		}, selector);
	};

	self.inDOM = property => {
		return tab.evaluate(function(property) {
			return window[property];
		}, property);
	};

	self.exists = selector => {
		return new Promise((resolve, reject) => {
			return self.count(selector)
			.then(count => {
				if (count) {
					resolve(count > 0);
				} else {
					reject();
				}
			}, reject);
		});
	};

	self.html = selector => {
		return tab.evaluate(function(selector) {
			if (selector) {
				return document.querySelector(selector).innerHTML;
			} else {
				return document.documentElement.innerHTML;
			}
		}, selector);
	};

	self.text = selector => {
		return tab.evaluate(function(selector) {
			if (selector) {
				return document.querySelector(selector).textContent;
			} else {
				return document.querySelector('body').textContent;
			}
		}, selector);
	};

	self.attribute = (selector, attr) => {
		return tab.evaluate(function(selector, attr) {
			return document.querySelector(selector).getAttribute(attr);
		}, selector, attr);
	};

	self.cssProperty = (selector, prop) => {
		return tab.evaluate(function(selector, prop) {
			return getComputedStyle(document.querySelector(selector))[prop];
		}, selector, prop);
	};

	self.width = selector => {
		return tab.evaluate(function(selector) {
			return document.querySelector(selector).offsetWidth;
		}, selector);
	};

	self.height = selector => {
		return tab.evaluate(function(selector) {
			return document.querySelector(selector).offsetHeight;
		}, selector);
	};

	self.visible = selector => {
		return tab.evaluate(function(selector) {
			return (document.querySelector(selector) ? elem.offsetWidth > 0 && elem.offsetHeight > 0 : false);
		}, selector);
	};

	self.on = (eventType, callback) => {
		if (eventType === 'timeout') {
			tab.onTimeout = callback;
		} else if (eventType === 'navigationRequested') {
			tab.onNavigationRequested = function(result) {
				callback(result[0]);
			};
		} else if (eventType === 'urlChanged') {
			tab.onUrlChanged = function(targetUrl) {
				callback(targetUrl);
			};
		} else if (eventType === 'resourceReceived') {
			tab.onResourceReceived = function(response) {
				callback(response);
			};
		} else if (eventType === 'loadFinished') {
			tab.onLoadFinished2 = callback;
		} else if (eventType === 'error') {
			tab.onError = callback;
		} else {
			let pageEvent = 'on' + eventType.charAt(0).toUpperCase() + eventType.slice(1);
			tab[pageEvent] = callback;
		}
	};

	self.wait = time => {
		return Promise.delay(time);
	};

	self.waitForNextPage = () => {
		return new Promise((resolve, reject) => {
			self.waitingForNextPage = true;
			let start = Date.now(),
				waiting = setInterval(() => {
				if (self.waitingForNextPage === false) {
					clearInterval(waiting);
					resolve();
				} else {
					let diff = Date.now() - start;
					if (diff > options.timeout) {
						clearInterval(waiting);
						reject('Timeout occurred before url changed.');
					}
				}
			}, options.interval);
		})
		.catch(timeoutCB);
	};

	self.waitForSelector = selector => {
		return tab.checkSelector(selector, options.retry);
	};

    return self;
};
