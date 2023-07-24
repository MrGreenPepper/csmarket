import * as steamScrapper from './steam/steamScrapper.js';

(async function start() {
	//scrapping basic item data from steam
	await steamScrapper.scrappingProtocol({
		renewData: false,
		scrapeUrls: false,
		scrapeContainer: false,
		extractContainerContent: true,
		calculateStatistics: true,
	});
})();
