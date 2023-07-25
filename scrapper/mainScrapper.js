import * as steamScrapper from './steam/steamScrapper.js';

(async function start() {
	//scrapping basic item data from steam
	await steamScrapper.scrappingProtocol({
		renewData: false,
		scrapeUrls: false,
		scrapeContainer: true,
		extractContainerContent: true,
		calculateStatistics: true,
	});
})();
