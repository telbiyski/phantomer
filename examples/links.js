var Phantomer = require('./phantomer');

var phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}});

var links = [];

var limitPages = 5;

var page = 0;

function getLinks() {
	return phantomer.evaluate(function() {
		var links = [];
		$("div.g h3.r a").each(function(item) {
			var link = {
				title : $(this).text(),
				url : $(this).attr("href")
			};
			links.push(link);
		});
		return links;
	});
}

function hasNextPage() {
	return phantomer.exists("#pnnext");
}

function scrape() {
	page += 1;
	return new Promise(function(resolve, reject) {
		return getLinks()
		.then(function(newLinks) {
			links = links.concat(newLinks);
			return hasNextPage()
			.then(function(hasNext) {
				if (hasNext && page < limitPages) {
					return phantomer
						.click("#pnnext")
						.then(phantomer.wait.bind(null,1000))
						.then(phantomer.injectJQ)
						.then(scrape);
				} else {
					resolve(links);
				}
			});
		})
		.then(resolve);
	});
}

phantomer
	.open('http://www.google.com')
	.then(phantomer.injectJQ)
	.then(phantomer.type.bind(null,"input[name='q']","horseman"))
	.then(phantomer.click.bind(null,"input[type='submit']"))
	.then(phantomer.click.bind(null,"button[type='submit']"))
	.then(phantomer.waitForSelector.bind(null,"div.g"))
	.then(scrape)
	.finally(function() {
		console.log(links);
		phantomer.close();
		process.exit();
	});