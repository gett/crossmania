var mania = require('crossmania').string();

mania.post('/', function(request, data, respond) {
	respond('yes this is post: '+data);
});
mania.put('/', function(request, data, respond) {
	respond('yes this is put: '+data);
});
mania.get('/', function(request, respond) {
	respond('yes this is get');
});
mania.del('/', function(request, respond) {
	respond('yes this is delete');
});

mania.listen(8000);
