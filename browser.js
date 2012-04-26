var curly = require('curly');

var noop = function() {};
var parseQuery = function(url) {
	var query = {};
	var queryString = url.split('?')[1];

	if (!queryString) {
		return null;
	}

	queryString = queryString.split('&');

	for (var i in queryString) {
		var parts = queryString[i].split('=');
	
		query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
	}

	return query;
};


var JSONPish = function(url) {
	this._query = parseQuery(url);
	this._req = curly.jsonp(url).async().strict();
};

JSONPish.prototype.bust = function(val, callback) {
	this._req.bust(val);

	return this._short(callback);
};
JSONPish.prototype.timeout = function(timeout, callback) {
	this._req.timeout(timeout);

	return this._short(callback);	
};
JSONPish.prototype.query = function(query, callback) {
	this._query = query;
	
	return this._short(callback);
};
JSONPish.prototype.destroy = function() {
	this._req.destroy();
	
	return this;	
};
JSONPish.prototype.json = function(data, callback) {
	if (data && typeof data !== 'function') {
		data = JSON.stringify(data);
	}
	return this.send(data, callback);
};
JSONPish.prototype.send = function(data, callback) {
	if (data && typeof data !== 'function') {
		this._query = this._query || {};
		this._query.body = data;
	} else {
		callback = data || noop;
	}
	if (this._query) {		
		this._req.query(this._query);
	}

	this._req.send(function(err, res) {
		callback(err, res);
	});
	return this;
};

JSONPish.prototype._short = function(a,b) {
	return a ? this.send(a,b) : this;
};

var methods = ['get', 'put', 'post', 'del'];
var jsonp = {};

var onjsonpmethod = function(method) {
	jsonp[method] = function(pathname, callback) {
		var req = new JSONPish(pathname);

		if (callback) {
			req.send(callback);
		}
		return req;
	};
};

for (var i in methods) {
	onjsonpmethod(methods[i]);
}

exports.create = function(host) {
	if (host.charAt(host.length-1) === '/') {
		host = host.substring(0, host.length-1);
	}
	if (host.indexOf('://') === -1) {
		host = 'http://'+host;
	}

	var that = {};
	var cors = curly.cors({
		host:host,
		proxy:'/mania/proxy',
		ping:'/mania/ping'
	});

	that.type = cors ? cors.type : 'jsonp';

	var onmethod = cors ? 
		function(method) {
			if (method === 'get' || method === 'post') {
				that[method] = function(pathname, callback) {
					return cors[method](pathname, callback); // save some bytes! :D
				};
				return;			
			}
			if (method === 'del') {
				that.del = function(pathname, callback) {
					return cors.post('/mania/delete'+pathname, callback);
				};
				return;
			}
			if (method === 'put') {
				that.put = function(pathname, callback) {
					return cors.post('/mania/put'+pathname, callback);
				};
				return;	
			}
		} :
		function(method) {
			that[method] = function(pathname, callback) {
				return jsonp[method](host+'/mania/jsonp-'+method+pathname, callback);
			};
		};

	for (var i in methods) {
		onmethod(methods[i]);
	}	
	return that;
};