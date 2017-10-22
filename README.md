Phantomer
=========

Run [PhantomJS](http://phantomjs.org/) from Node with Phantomer.

Horseman alternative made with Promises.

Inspired by Horseman.

### Why?
I had problems with horseman for my projects, because horseman use `node-phantom-simple` instead `node-phantom-async`.

And also i don't like the code of the new version (3). (Based on previous version.)

But still good work.


Phantomer has:

  * Promise chainable,
  * an easy-to-use control flow (see the examples),
  * no tabs, no frames (like horseman),
  * using node-phantom-async,
  * using bluebird.
  * easy for maintain (1 file, ~500 lines code)

## Examples

See exaples folder.

Run: `node example.js`.

## Warning

Not full tested. Use at your own risk.

## Installation

`npm i phantomer`

Note: Make sure PhantomJS is available in your path.

## API

### Setup

#### new Phantomer(options)

Create a new instance that can navigate around the web.

The available options are:

  * `parameters` - phantomjs parameters
  * `settings` - phantomjs settings
  * `userAgent` - set user agent if no settings
  * `timeout`: how long to wait for page loads or wait periods,
    default `5000` ms.
  * `interval`: how frequently to poll for page load state, default `50` ms.

### Configuration

#### .setProxy(ip, \[port\], \[type\], \[user, pass\])

Dynamically set proxy settings (***requires PhantomJS 2.0.0 or above***).
The `ip` argument can either be the IP of the proxy server,
or a URI of the form `type://user:pass@ip:port`.

The `port` is optional and defaults to `80`.
The `type` is optional and defaults to `'http'`.
The `user` and `pass` are the optional username and password for authentication,
by default no authentication is used.

### Cleanup

Be sure to `.close()` each Phantomer instance when you're done with it!

#### .close()

Closes the Phantomer instance by shutting down PhantomJS.

### Navigation

#### .open(url)

Load the page at `url`.

#### .post(url, postData)

POST `postData` to the page at `url`.

#### .back()

Go back to the previous page.

#### .forward()

Go forward to the next page.

#### .reload()

Refresh the current page.

#### .cookies(\[object|array of objects|string\])

Without any options,
this function will return all the cookies inside the browser.

You can pass in a cookie object to add to the cookie jar.

```js
[ { domain: '.httpbin.org',
    httponly: false,
    name: 'test',
    path: '/',
    secure: false,
    value: 'cookie' } ]
```

You can pass in an array of cookie objects
to reset all the cookies in the cookie jar
(or pass an empty array to remove all cookies).

[cookies.txt]: <http://www.cookiecentral.com/faq/#3.5>
You can pass in the name of a [cookies.txt][] formatted file
to reset all the cookies in the cookie jar
to those contained in the file.

#### .headers(headers)

Set the `headers` used when requesting a page.
The headers are a javascript object.
You have to set the headers before calling `.open()`.

#### .authentication(user, password)

Set the `user` and `password` for accessing a web page
using basic authentication.
Be sure to set it before calling `.open(url)`.

#### .viewport(width, height)

Set the `width` and `height` of the viewport, useful for screenshotting.
You have to set the viewport before calling `.open()`.

#### .scrollTo(top, left)

Scroll to a position on the page,
relative to the top left corner of the document.

#### .zoom(zoomFactor)

Set the amount of zoom on a page.  The default zoomFactor is 1.
To zoom to 200%, use a zoomFactor of 2.
Combine this with `viewport` to produce high DPI screenshots.

### Evaluation

Evaluation elements return information from the page.

#### .title()

Get the title of the current page.

#### .url()

Get the URL of the current page.

#### .visible(selector)

Determines if a selector is visible, or not, on the page. Returns a boolean.

#### .exists(selector)

Determines if the selector exists, or not, on the page. Returns a boolean.

#### .count(selector)

Counts the number of `selector` on the page. Returns a number.

#### .html(selector)

Gets the HTML inside of an element.
If no `selector` is provided, it returns the HTML of the entire page.

#### .text(selector)

Gets the text inside of an element.

#### .value(selector, \[val\])

Get, or set, the value of an element.

#### .attribute(selector, attribute)

Gets an attribute of an element.

#### .cssProperty(selector, property)

Gets a CSS property of an element.

#### .width(selector)

Gets the width of an element.

#### .height(selector)

Gets the height of an element.

#### .screenshot(path)

Saves a screenshot of the current page to the specified `path`.
Useful for debugging.

#### .screenshotBase64(type)

Returns a base64 encoded string representing the screenshot.
Type must be one of 'PNG', 'GIF', or 'JPEG'.

#### .crop(area, path)

Takes a cropped screenshot of the page.
`area` can be a string identifying an html element on the screen to crop to,
or a getBoundingClientRect object.

#### .pdf(path, \[paperSize\])

[US Letter]: <http://en.wikipedia.org/wiki/Letter_%28paper_size%29>
Renders the page as a PDF.
The default paperSize is [US Letter][].

The `paperSize` object should be in either this format:

```js
{
  width: '200px',
  height: '300px',
  margin: '0px'
}
```

or this format

```js
{
  format: 'A4',
  orientation: 'portrait',
  margin: '1cm'
}
```

Supported formats are: `A3`, `A4`, `A5`, `Legal`, `Letter`, `Tabloid`.

Orientation (`portrait`, `landscape`) is optional and defaults to 'portrait'.

Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.

You can create a header and footer like this:

```js
  pdf('amazon.pdf', {
    format: 'Letter',
    orientation: 'portrait',
    margin: '0.5in',
    header: {
      height: '3cm',
      contents: function(pageNum, numPages) {
        if (pageNum == 1) {
          return '';
        }
        return '<h3>Header ' + pageNum + ' / ' + numPages + '</h3>';
      }
    },
    footer: {
      height: '3cm',
      contents: function(pageNum, numPages) {
        if (pageNum == 1) {
          return '';
        }
        return '<h3>Footer ' + pageNum + ' / ' + numPages + '</h3>';
      }
    }
  })
```

#### .do(fn)

Run an function without breaking the chain. Works with asynchronous functions.
Must call the callback when complete.

```js
  do(function(done){
    setTimeout(done,1000);
  })
```

#### .evaluate(fn, \[arg1, arg2,...\])

Invokes `fn` on the page with args. On completion it returns a value.
Useful for extracting information from the page.

```js
  evaluate( function(selector){
      // This code is executed inside the browser.
      // It's sandboxed from Node, and has no access to anything
      // in Node scope, unless you pass it in, like we did with 'selector'.
	  return value;
    }, '.selector')
  .then(function(result){
    console.log(result);
  });
```

#### .click(selector)

Clicks the `selector` element once.

#### .clear(selector)

Sets the value of an element to `''`.

#### .type(selector, text, \[options\])

Enters the `text` provided into the `selector` element.
Options is an object containing `eventType`
(`'keypress'`, `'keyup'`, `'keydown'`. Default is `'keypress'`)
and `modifiers`, which is a string in the form of `ctrl+shift+alt`.

#### .upload(selector, path)

Specify the `path` to upload into a file input `selector` element.

#### .injectJs(file)

Inject a JavaScript file onto the page.

#### .includeJs(url)

Include an external JavaScript script on the page via URL.

#### .injectJQ()

Inject jQuery onto the page.

#### .mouseEvent(type, \[x, y, \[button\]\])

Send a mouse event to the page.
Each event is sent to the page as if it comes from real user interaction.
`type` must be one of
`'mouseup'`, `'mousedown'`, `'mousemove'`, `'doubleclick'`, or `'click'`,
which is the default.
`x` and `y` are optional
and specify the location on the page to send the mouse event.
`button` is also optional, and defaults to `'left'`.

#### .keyboardEvent(type, key, \[modifier\])

[phantom keys]: <https://github.com/ariya/phantomjs/commit/cab2635e66d74b7e665c44400b8b20a8f225153a>
Send a keyboard event to the page.
Each event is sent to the page as if it comes from real user interaction.
`type` must be one of `'keyup'`, `'keydown'`, or `'keypress'`,
which is the default.
`key` should be a numerical value from [this page][phantom keys].
For instance, to send an "enter" key press,
use `.keyboardEvent('keypress',16777221)`.

`modifier` is optional, and comes from this list:

  * 0x02000000: A Shift key on the keyboard is pressed
  * 0x04000000: A Ctrl key on the keyboard is pressed
  * 0x08000000: An Alt key on the keyboard is pressed
  * 0x10000000: A Meta key on the keyboard is pressed
  * 0x20000000: A keypad button is pressed

To send a shift+p event,
you would use `.keyboardEvent('keypress','p',0x02000000)`.

### Waiting

These functions for the browser to wait for an event to occur.
If the event does not occur before the timeout period
(configurable via the options),
a timeout event will be fired and the Promise for the action will reject.

#### .wait(ms)

Wait for `ms` milliseconds e.g. `.wait(5000)`

#### .waitForNextPage()

Wait until a page finishes loading, typically after a `.click()`.

#### .waitForSelector(selector)

Wait until the element `selector` is present,
e.g., `.waitForSelector('#pay-button')`

#### .waitFor(fn, \[arg1, arg2,...\], value)

Wait until the `fn` evaluated on the page returns the *specified* `value`.
`fn` is invoked with args.

```js
// This will call the function in the browser repeatedly
// until true (or whatever else you specified) is returned
  .waitFor(function waitForSelectorCount(selector, count) {
    return $(selector).length >= count
  }, '.some-selector', 2, true)
  // last argument (true here) is what return value to wait for
```

### Events

#### .on(event, callback)

Respond to page events with the callback.
Be sure to set these before calling `.open()`.
The `callback` is evaluated in node.
If you need to return from `callback`, you probably want `.at` instead.

Supported events are:

  * `initialized` - callback()
  * `loadStarted` - callback()
  * `loadFinished` - callback(status)
  * `tabCreated` - callback(tabNum)
  * `tabClosed` - callback(tabNum)
  * `urlChanged` - callback(targetUrl)
  * `navigationRequested` - callback(url, type, willNavigate, main)
  * `resourceRequested` - callback(requestData, networkRequest)
  * `resourceReceived` - callback(response)
  * `consoleMessage` - callback(msg, lineNumber, sourceId)
  * `alert` - callback(msg)
  * `confirm` - callback(msg)
  * `prompt` - callback(msg, defaultValue)
  * `error` - callback(msg, trace)
  * `timeout` - callback(msg) - Fired when a wait timeout period elapses.

[the full callbacks list for phantomjs]: <https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#callbacks-list>
For a more in depth description, see [the full callbacks list for phantomjs][].

```js
  .on('consoleMessage', function( msg ){
    console.log(msg);
  })
```
## New on 1.0.2
phantom bug with Auth settings - use for settings: {parameters:{}, auth:{'Authorization': btoa('user:pass')}}
plainText method

## New on 1.0.4
phantomPath -> phantomer.create({parameters:{'ignore-ssl-errors':'yes'}, phantomPath: require('phantomjs').path})
-reference: node-phantom-async

## New on 1.0.5
jquery 3.2.1
ES2015 version.
code improvements
major bug fixed -> exist function

## License (MIT)

Copyright (c) Petar Telbiyski <telbiyski@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
