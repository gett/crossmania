# crossmania

talk crossdomain with your browser. it's available through npm:

	npm install crossmania

usage is simple:

``` js
var mania = require('crossmania');

mania.get('/', function(request, respond) {
	respond({hello:'world'}); // yes we talk json
});
mania.post('/', function(request, data, respond) {
	respond(data); // we echo
});
mania.listen(80);

```

mania works by relying on `cors` based ajax if available (chrome, safari, firefox).  
for IE8+ and Opera it uses an iframe proxy frame and the `postMessage` api.
for IE7- and all others it falls back to an jsonp wrapper.  

In the browser use the (crossmania)[http://github.com/gett/crossmania-js] available for client-side javascript
