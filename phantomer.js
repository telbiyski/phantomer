/*
 Phantomer v1.0.0
 (c) 2016 Petar Telbiyski. http://telbiyski.com
 License: MIT
*/

var phantom = require('node-phantom-async'),
	defaults = require('defaults'),
    Promise = require('bluebird');

var Phantomer = function(options) {
    var self = this,
		browser = null,
		tab = null;

	options = options || {};
	options.timeout = options.timeout || 15000;
	options.interval = options.interval || 50;

	function addCookies(cookies) {
		return new Promise(function(resolve, reject) {
			var totalCookies = cookies.length,
				cookiesAdded = 0;
			if (totalCookies) {
				for (var i = 0, len = totalCookies; i < len; i++) {
					(function(cookie) {
						return browser.addCookie(cookie)
						.then(function() {
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
		return new Promise(function(resolve, reject) {
			return browser.createPage()
			.then(function (page) {
				return new Promise(function(resolve, reject){
					return page.get('settings')
					.then(function(settings) {
                        if (options.settings) {
                            settings = options.settings;
                        } else {
                            settings.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36';
                        }
						if (options.auth) {
							page.set('customHeaders', options.auth);
						}
						page.set('settings', settings)
						.then(function() {
							tab = page;
							tab.onTimeout = function() {
								console.log("Phantom Page Timeout");
							};
							tab.onLoadFinished = function() {
								self.waitingForNextPage = false;
								if (tab.onLoadFinished2) tab.onLoadFinished2();
							}.bind(self);
							if (self.cokies) {
								return addCookies(self.cookies)
								.then(function(){
									resolve(page);
								}, reject)
							} else {
								resolve(page);
							}
						}, reject);
					}, reject);
				});
			}, function(e){throw new Error(e);})
			.then(resolve)
			.catch(reject);
		});
	}

	function prepare() {
		return new Promise(function(resolve, reject) {
			phantom.create({parameters: options.parameters}).then(function(instance) {
				browser = instance;
				return pager().then(resolve);
			}, function(err) {
				reject(err);
			});
		}).bind(self);
	}

	function val(selector, value) {
		if (typeof value === "undefined") {
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

	self.open = function(url) {
		return prepare()
		.then(function(){
			return tab.open(url);
		});
	};

	self.goTo = function(url) {
		return tab.open(url);
	};

	self.newPage = function(url) {
		return tab.get('cookies')
		.then(function(c){
			self.cokies = c;
			return tab.close()
			.then(function(){
				return pager()
				.then(function(){
					return tab.open(url);
				});
			});
		})
	};

	self.title = function() {
		return tab.get('title');
	};

	self.injectJQ = function() {
		return new Promise(function(resolve, reject) {
			return tab.evaluate(function() {
				delete window.jQuery;
			})
			.then(function(){
				return tab.injectJs('./jquery-2.2.3.min.js');
			}, reject)
			.then(function(){
				return self.wait(1000).then(resolve, reject);
			}, reject);
		});
	};

	self.close = function() {
		return browser.exit();
	};

	self.headers = function(headers) {
		return tab.set('customHeaders', headers);
	};

	self.back = function() {
		return tab.goBack();
	};

	self.forward = function() {
		return tab.goForward();
	};

	self.authentication = function(user, password) {
		return new Promise(function(resolve, reject) {
			return tab.get('settings')
			.then(function(settings) {
				settings.userName = user;
				settings.password = password;
				return tab.set('settings', settings);
			}, reject);
		});
	};

	self.viewport = function(width, height) {
		if (!width) {
			return tab.evaluate(function() {
				return {
					width: window.innerWidth,
					height: window.innerHeight
				};
			});
		} else {
			return new Promise(function(resolve, reject) {
				var viewport = {
					width: width,
					height: height
				};
				return tab.set('viewportSize', viewport);
			})
		}
	};

	self.zoom = function(zoomFactor) {
		return tab.set('zoomFactor', zoomFactor);
	};

	self.plainText = function() {
		return tab.get('plainText');
	};

	self.scrollTo = function(top, left) {
		var position = {
			top: top,
			left: left
		};
		return tab.set('scrollPosition', position);
	};

	self.post = function(url, postData) {
		return tab.open(url, 'POST', postData);
	};

	self.reload = function() {
		return tab.evaluate(function() {
			document.location.reload(true);
		});
	};

	self.cookies = function(arg) {
		if (arg) {
			if (arg instanceof Array) {
				return new Promise(function(resolve, reject) {
					return browser.clearCookies()
					.then(function() {
						return addCookies(arg);
					}, reject);
				});
			} else if (typeof arg === "object") {
				return browser.addCookie(arg);
			}
		} else {
			return tab.get('cookies');
		}
	};

	self.screenshot = function(path) {
		return tab.render(path);
	};

	self.click = function(selector) {
		return tab.evaluate(function(selector) {
			var element = document.querySelector(selector);
			var event = document.createEvent('MouseEvent');
			event.initEvent('click', true, false);
			element.dispatchEvent(event);
		}, selector);
	};

	self.boundingRectangle = function(selector) {
		return tab.evaluate(function(selector) {
			var element = document.querySelector(selector);
			return element.getBoundingClientRect();
		}, selector);
	};

	self.crop = function(area, path) {
		function doCrop(rect) {
			return new Promise(function(resolve, reject) {
				return tab.get('clipRect')
				.then(function(prevClipRect) {
					return tab.set('clipRect', rect)
					.then(function() {
						return tab.render(path)
						.then(function() {
							return tab.set('clipRect', prevClipRect).then(resolve,reject);
						}, reject);
					}, reject);
				}, reject);
			});
		}
		if (typeof area === "string") {
			return self.boundingRectangle(area).then(doCrop);
		} else {
			return doCrop(area);
		}
	};

	self.clip = function(rect) {
		return tab.set('clipRect', rect);
	};

	self.screenshotBase64 = function(type) {
		return new Promise(function(resolve, reject) {
			if (['PNG', 'GIF', 'JPEG'].indexOf(type) == -1) {
				reject("screenshotBase64 type must be PNG, GIF, or JPEG.");
			} else {
				return tab.renderBase64(type);
			}
		});
	};

	self.pdf = function(path, paperSize) {
		if (!paperSize) {
			paperSize = {
				format: 'A4',
				orientation: 'portrait',
				margin: '0.5in'
			};
		}
		return new Promise(function(resolve, reject) {
			return tab.set('paperSize', paperSize)
			.then(function() {
				return tab.render(path, {format:'pdf', quality:'100'});
			}, reject);
		});
	};

	self.injectJs = function(file) {
		return tab.injectJs(file);
	};

	self.includeJs = function(url) {
		return tab.includeJs(url);
	};

	self.value = function(selector, value) {
		return val(selector, value);
	};

	self.clear = function(selector) {
		return val(selector, "");
	};

	self.keyboardEvent = function(type, key, modifier) {
		type = (typeof type === "undefined") ? 'keypress' : type;
		key = (typeof key === "undefined") ? null : key;
		modifier = (typeof modifier === "undefined") ? 0 : modifier;
		return tab.sendEvent(type, key, null, null, modifier);
	};

	self.mouseEvent = function(type, x, y, button) {
		type = (typeof type === "undefined") ? "click" : type;
		x = (typeof x === "undefined") ? null : x;
		y = (typeof y === "undefined") ? null : y;
		button = (typeof button === "undefined") ? "left" : button;
		return tab.sendEvent(type, x, y, button);
	};

	self.type = function(selector, text, options) {
		var DEFAULTS = {
			reset: false,
			eventType: 'keypress',
			keepFocus: false
		};
		function computeModifier(modifierString) {
			var modifiers = {
				"ctrl": 0x04000000,
				"shift": 0x02000000,
				"alt": 0x08000000,
				"meta": 0x10000000,
				"keypad": 0x20000000
			};
			var modifier = 0,
				checkKey = function(key) {
					if (key in modifiers) return;
				};
			if (!modifierString) return modifier;
			var keys = modifierString.split('+');
			keys.forEach(checkKey);
			return keys.reduce(function(acc, key) {
				return acc | modifiers[key];
			}, modifier);
		}
		var modifiers = computeModifier(options && options.modifiers);
		var opts = defaults(options || {}, DEFAULTS);
		return new Promise(function(resolve, reject) {
			return tab.evaluate(function(selector) {
				if(document.querySelector(selector)) document.querySelector(selector).focus();
			}, selector)
			.then(function(selector) {
				for (var i = 0, len = text.length; i < len; i++) {
					tab.sendEvent(opts.eventType, text[i], null, null, modifiers);
				}
				resolve();
			});
		});
	};

	self.upload = function(selector, path) {
		return tab.uploadFile(selector, path);
	};

	self.setProxy = function(ip, port, type, user, pass) {
		return browser.setProxy(ip, port, type, user, pass);
	};

	self.do = function(fn) {
		return new Promise(function(resolve, reject){
			fn(resolve);
		});
	};

	self.evaluate = function() {
		var args = Array.prototype.slice.call(arguments);
		return tab.evaluate.apply(tab, args);
	};

	self.url = function() {
		return tab.evaluate(function() {
			return document.location.href;
		});
	};

	self.count = function(selector) {
		return tab.evaluate(function(selector) {
			return document.querySelectorAll(selector).length;
		}, selector);
	};

	self.exists = function(selector) {
		return new Promise(function(resolve, reject) {
			return self.count(selector).then(function(count) {
				resolve(count > 0);
			}, reject);
		});
	};

	self.html = function(selector) {
		return tab.evaluate(function(selector) {
			if (selector) {
				return document.querySelector(selector).innerHTML;
			} else {
				return document.documentElement.innerHTML;
			}
		}, selector);
	};

	self.text = function(selector) {
		return tab.evaluate(function(selector) {
			if (selector) {
				return document.querySelector(selector).textContent;
			} else {
				return document.querySelector("body").textContent;
			}
		}, selector);
	};

	self.attribute = function(selector, attr) {
		return tab.evaluate(function(selector, attr) {
			return document.querySelector(selector).getAttribute(attr);
		}, selector, attr);
	};

	self.cssProperty = function(selector, prop) {
		return tab.evaluate(function(selector, prop) {
			return getComputedStyle(document.querySelector(selector))[prop];
		}, selector, prop);
	};

	self.width = function(selector) {
		return tab.evaluate(function(selector) {
			return document.querySelector(selector).offsetWidth;
		}, selector);
	};

	self.height = function(selector) {
		return tab.evaluate(function(selector) {
			return document.querySelector(selector).offsetHeight;
		}, selector);
	};

	self.visible = function(selector) {
		return tab.evaluate(function(selector) {
			return (document.querySelector(selector) ? elem.offsetWidth > 0 && elem.offsetHeight > 0 : false);
		}, selector);
	};

	self.on = function(eventType, callback) {
		if (eventType == "timeout") {
			tab.onTimeout = callback;
		} else if (eventType == "navigationRequested") {
			tab.onNavigationRequested = function(result) {
				callback(result[0]);
			};
		} else if (eventType == "urlChanged") {
			tab.onUrlChanged = function(targetUrl) {
				callback(targetUrl);
			};
		} else if (eventType == "resourceReceived") {
			tab.onResourceReceived = function(response) {
				callback(response);
			};
		} else if (eventType == "loadFinished") {
			tab.onLoadFinished2 = callback;
		} else if (eventType == 'error') {
			tab.onError = callback;
		} else {
			var pageEvent = "on" + eventType.charAt(0).toUpperCase() + eventType.slice(1);
			tab[pageEvent] = callback;
		}
	};

	self.wait = function(time) {
		return Promise.delay(time);
	};

	self.waitForNextPage = function() {
		return new Promise(function(resolve, reject) {
			self.waitingForNextPage = true;
			var start = Date.now();
			var waiting = setInterval(function() {
				if (self.waitingForNextPage === false) {
					clearInterval(waiting);
					resolve();
				} else {
					var diff = Date.now() - start;
					if (diff > options.timeout) {
						clearInterval(waiting);
						reject('Timeout occurred before url changed.');
					}
				}
			}, options.interval);
		})
		.catch(timeoutCB);
	};

	self.waitForSelector = function(selector) {
		eval("var elementPresent = function() {" +
			"  var element = document.querySelector('" + selector + "');" +
			"  return (element ? true : false);" +
			"};");
		return self.waitFor(elementPresent, true);
	};

	self.waitFor = function(fn, value) {
		return new Promise(function(resolve, reject) {
			var start = Date.now();
			var checkInterval = setInterval(function() {
				var diff = Date.now() - start;
				if (diff > options.timeout) {
					clearInterval(checkInterval);
					reject('Timeout occurred before url changed.');
				} else {
					return tab.evaluate(fn)
					.then(function(res) {
						if (res === value) {
							clearInterval(checkInterval);
							resolve();
						}
					})
				}
			}, options.interval);
		})
		.catch(timeoutCB);
	};

    return self;
};

module.exports = Phantomer;