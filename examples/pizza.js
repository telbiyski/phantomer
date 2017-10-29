const Phantomer = require('../phantomer');

let phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}});

phantomer.open('http://lite.yelp.com/search?find_desc=pizza&find_loc=94040&ns=1')
.then(phantomer.text.bind(null,'address'))
.then(text => {
	console.log(text);
})
.finally(() => {
	phantomer.close();
	process.exit();
});
