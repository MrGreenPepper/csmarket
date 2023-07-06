import * as steamScrapper from './steam/steamScrapper.js';

export async function start() {
	//scrapping basic item data from steam
	await steamScrapper.scrappingProtocol({ renewData: false, scrapeUrls: false, scrapeContent: true });

	//scBrowser = scrappingBrowser.start();
	let scrappingURL;
}
