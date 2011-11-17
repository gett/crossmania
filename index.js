var router = require('router');
var buffoon = require('buffoon');
var common = require('common');
var parseURL = require('url').parse;

var PROXY = require('fs').readFileSync(__dirname+'/proxy.html');
var noop = function() {};

exports.string = function(server) {
	return exports.create(server, {json:false});
};
exports.json = function(server) {
	return exports.create(server, {json:true});	
};
exports.create = function(server, options) {
	options = options || {};
	server = server || router.create();

	var json = options.json !== false;
	var that = {};
	var type = json ? 'application/json' : 'text/plain';

	var querify = function(request) {
		return request.query = request.query || parseURL(request.url, true).query;
	};
	var responder = function(response, jsonp) {
		return function(status, headers, body) {
			if (typeof status !== 'number') {
				body = status;
				headers = {};
				status = 200;
			} else if (!body) {
				body = headers;
				headers = {};
			}

			if (json && !jsonp) {
				body = JSON.stringify(body);
			}
			if (jsonp) { // also validate the jsonp thingy
				body = jsonp+'('+JSON.stringify(body)+');';
				headers['content-type'] = 'text/javascript';
				status = 200;
			}
			if (body) {
				headers['content-length'] = Buffer.byteLength(body);			
			}
			headers['content-type'] = headers['content-type'] || type;
			headers['access-control-allow-origin'] = '*';

			response.writeHead(status, headers);
			response.end(body);
		};
	};

	var onbodyroute = function(method) {
		return function(pattern, callback) {
			var invoke = function(request, data, jsonp, response) {
				if (options.jsonp) {
					data = (data && JSON.parse(data)) || {};
				}
				callback(request, data, responder(response, jsonp));
			};
			var onbodyrequest = function(request, response) {
				buffoon.string(request, common.fork(noop, function(data) {
					querify(request);
					invoke(request, data, false, response);
				}));
			};

			server.get('/mania/jsonp-'+method+pattern, function(request, response) {
				var query = querify(request);

				invoke(request, query.body || '', query.callback, response);
			});

			server.post('/mania/'+method+pattern, onbodyrequest);
			server[method](pattern, onbodyrequest);
		};
	};
	var onroute = function(method) {
		return function(pattern, callback) {
			var invoke = function(request, jsonp, response) {
				callback(request, responder(response, jsonp));					
			};
			var onrequest = function(request, response) {
				querify(request);
				invoke(request, false, response);
			};

			server.get('/mania/jsonp-'+method+pattern, function(request, response) {
				querify(request);
				invoke(request, request.query.callback, response);
			});

			server[method === 'delete' ? 'post' : 'get']('/mania/'+method+pattern, onrequest);
			server[method.replace('delete', 'del')](pattern, onrequest);			
		};
	};

	['get', 'post', 'put', 'del'].forEach(function(method) {
		that[method] = (method === 'get' || method === 'del') ? onroute(method.replace('del', 'delete')) : onbodyroute(method);
	});

	server.options(function(request, response) {
		response.writeHead(200, {
			'access-control-allow-origin':'*',
			'access-control-allow-methods':'POST, GET, OPTIONS',
			'access-control-allow-headers':'Content-Type'
		});
		response.end();
	});
	server.get('/mania/proxy', function(request, response) {
		response.writeHead(200, {'content-type':'text/html', 'content-length':PROXY.length});
		response.end(PROXY);
	});

	for (var method in server) {
		if (that[method]) {
			continue;
		}
		that[method] = server[method];
	}

	return that;
};