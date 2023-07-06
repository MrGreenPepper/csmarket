import * as steamScrapper from './steam/steamScrapper.js';

export async function start() {
	//scrapping basic item data from steam
	await steamScrapper.scrappingProtocol({
		renewData: false,
		scrapeUrls: false,
		scrapeContainer: false,
		extractContainerContent: false,
	});

	//scBrowser = scrappingBrowser.start();
	let scrappingURL;
}
