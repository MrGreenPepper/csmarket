import * as steamscraper from './steam/scrapingProtocol.js';

(async function start() {
	//scraping basic item data from steam
	await steamscraper.scrapingProtocol({
		renewData: false,
		scrapeUrls: false,
		scrapeContainer: false,
		extractContainerContent: false,
		calculateStatistics: true,
	});
})();
