var Phantomer = require('./phantomer');

var phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}});

phantomer
	.open('http://lite.yelp.com/search?find_desc=pizza&find_loc=94040&find_submit=Search')
	.then(phantomer.text.bind(null,'address'))
	.then(function(text) {
		console.log(text);
	})
	.finally(function() {
		phantomer.close();
		process.exit();
	});