const bluebirdRetry = require('bluebird-retry');

function checkSelector(selector, retryOptions) {
    return retry(_checkSelector.bind(this), retryOptions);

    function _checkSelector() {
        return check(this.evaluate(_browserCheckSelector, selector));
    }
}

function getSelectorRect(selector, retryOptions) {
    return retry(_getSelectorRect.bind(this), retryOptions);

    function _getSelectorRect() {
        return check(this.evaluate(_browserGetSelectorRect, selector));
    }
}

function getSelectorVisiblePoint(selector, retryOptions) {
    return retry(_getSelectorVisiblePoint.bind(this), retryOptions);

    function _getSelectorVisiblePoint() {
        return check(this.evaluate(_browserGetSelectorVisiblePoint, selector));
    }
}

function sendMouseEventToSelector(selector, mouseEventType, button, retryOptions) {
    if (!retryOptions && typeof button == 'object') {
        retryOptions = button;
        button = undefined;
    }

    return this.getSelectorVisiblePoint(selector, retryOptions)
    .then(point => {
        return this.sendEvent(mouseEventType, point.x, point.y, button);
    });
}

function clickSelector(selector, button, retryOptions) {
    return this.sendMouseEventToSelector(selector, 'click', button, retryOptions);
}

function submitForm(formSelector, data, retryOptions) {
    return this.checkSelector(formSelector, retryOptions)
    .then(() => {
        return check(this.evaluate(_browserSubmitForm, formSelector, data));
    });
}

function retry(func, retryOptions) {
    return retryOptions ? bluebirdRetry(func, retryOptions) : func();
}

function check(promise) {
    return promise.then(value => {
        if (value && typeof value === 'string') throw new Error(value);
        if (!value) throw new Error('Selector not found');
        return value;
    });
}

function _browserCheckSelector(sel) {
    return !!document.querySelector(sel) || 'Element not found';
}

function _browserGetSelectorRect(sel) {
    var el = document.querySelector(sel);
    if (!el) return 'Element not found';
    return el.getBoundingClientRect();
}

function _browserGetSelectorVisiblePoint(sel) {
	var point;
    var el = document.querySelector(sel);
    if (!el) return 'Element "' + sel + '" not found';
    var r = el.getBoundingClientRect();
	if (r) {
		var elfp = document.elementFromPoint(r.left + 2, r.top + 2);
	    if (elfp == el) {
	        point = { x: r.left, y: r.top };
		}
	}

    return point || 'Element "' + sel + '" not visible';
}

function _browserSubmitForm(formSelector, data) {
    try {
        var form = getElement(document, formSelector, 'form');
        for (var field in data) {
            var selector = '[name="' + field + '"]';
            var input = getElement(form, selector, 'input');
            input.value = data[field];
        }
        form.submit();
    } catch(e) {
        return e.message;
    }
    return true;

    function getElement(root, selector, tagName) {
        var el = root.querySelector(selector);
        if (!el) throw new Error(selector + ': not found');
        if (el.tagName.toLowerCase() != tagName)
            throw new Error(selector + ': is not ' + tagName);
        return el;
    }
}

module.exports = {
    checkSelector: checkSelector,
    getSelectorRect: getSelectorRect,
    getSelectorVisiblePoint: getSelectorVisiblePoint,
    sendMouseEventToSelector: sendMouseEventToSelector,
    clickSelector: clickSelector,
    submitForm: submitForm
};
