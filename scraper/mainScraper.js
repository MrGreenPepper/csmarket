import * as dbHandler from '../tools/database/dbHandler.mjs';
import * as steamScraper from './steam/steamScraper.js';

(async function start() {
	//scraping basic item data from steam
	await steamScraper.scrapingProtocol();
	//create itemList out of the containerContents
	let itemList = await createItemListfromContainersContents();

	for (let item of itemList) {
		item =
			'https://steamcommunity.com/market/listings/730/Dual%20Berettas%20%7C%20Anodized%20Navy%20(Minimal%20Wear)';
		let itemData = await steamScraper(item);
	}
})();

async function createItemListfromContainersContents() {
	let containerContent = await dbHandler
		.sqlQuery('SELECT itemdescription from containercontent')
		.then((res) => res.rows);
	let itemList = [];

	containerContent.forEach((entry) => {
		let itemDescription = entry.itemdescription;
		let itemContents = itemDescription.items;
		itemContents.forEach((item) => {
			if (!itemList.includes(item)) itemList.push(item);
		});
	});

	return itemList;
}
