const Phantomer = require('../phantomer');

let users = ['PhantomJS', 'ariyahidayat', 'detronizator', 'KDABQt', 'lfranchi', 'jonleighton', '_jamesmgreene', 'Vitalliumm'],
	count = 0;

users.forEach(user => {
	var phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}});
	phantomer.open('http://twitter.com/' + user)
	.then(phantomer.text.bind(null,'.ProfileNav-item--followers .ProfileNav-value'))
	.then(text => {
		console.log(user + ' followers: ' + text);
		count++;
	})
	.finally(() => {
		phantomer.close();
		if (count === users.length) process.exit();
	});
});
