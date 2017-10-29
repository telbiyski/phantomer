const Phantomer = require('../phantomer');

let phantomer = new Phantomer({parameters:{'ignore-ssl-errors':'yes'}}),
	links = [],
	limitPages = 3,
	page = 0;

function getLinks() {
	return phantomer.evaluate(function() {
		var links = [];
		$("div.g h3.r a").each(function() {
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
	return phantomer.exists("#pnnext span");
}

function scrape() {
	page += 1;
	return phantomer.injectJQ()
	.then(getLinks)
	.then(newLinks => {
		links = links.concat(newLinks);
		return hasNextPage();
	})
	.then(hasNext => {
		if (hasNext && page < limitPages) {
			return phantomer.scrollTo(600, 0)
				.then(phantomer.click.bind(null,'#pnnext span'))
				.then(phantomer.wait.bind(null,1000))
				.then(scrape);
		} else {
			return true;
		}
	});
}

phantomer.open('http://www.google.com')
.then(phantomer.wait.bind(null,1000))
.then(phantomer.type.bind(null,'input[name="q"]','phantomjsENTER'))
.then(phantomer.wait.bind(null,1000))
.then(phantomer.waitForSelector.bind(null,'div.g'))
.then(phantomer.wait.bind(null,1000))
.then(scrape)
.finally(() => {
	console.log(links);
	console.log(links.length + ' links found in ' + limitPages + ' pages.');
	phantomer.close();
	process.exit();
});
