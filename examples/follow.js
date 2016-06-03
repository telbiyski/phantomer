var Phantomer = require('./phantomer');

var users = ['PhantomJS',
	'ariyahidayat',
	'detronizator',
	'KDABQt',
	'lfranchi',
	'jonleighton',
	'_jamesmgreene',
	'Vitalliumm'];

users.forEach(function(user) {
	var phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}});
	phantomer
		.open('http://mobile.twitter.com/'+user)
		.then(phantomer.text.bind(null,'.UserProfileHeader-stat--followers .UserProfileHeader-statCount'))
		.then(function(text) {
			console.log(user + ': ' + text);
		})
		.finally(function() {
			phantomer.close();
		});
});