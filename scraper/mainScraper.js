import * as dbHandler from '../tools/database/dbHandler.mjs';
import * as steamScraper from './steam/steamScraper.js';

(async function start() {
	//scraping basic item data from steam
	await steamScraper.scrapingProtocol();
	//create itemList out of the containerContents
	let itemList = await createItemListfromContainersContents();
	itemList = convertItemListToSteamUrls(itemList);
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

/** converts the itemDescription into an steamUrl
 * the steamItemUrls have the following syntax: https://steamcommunity.com/market/listings/730/ + ItemName + ' | ' + SkinName + optional:(exterior)
 */
function convertItemListToSteamUrls(itemList) {
	let steamStandard = 'https://steamcommunity.com/market/listings/730/';
	let exteriors = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
	itemList = itemList.map((entry) => {
		let steamUrls = [];
		let mainSteamUrl = steamStandard + entry.itemName + ' | ' + entry.skinName;
		//test for weapon
		if (Object.keys(entry).includes('itemRarity')) {
			exteriors.forEach((ext) => {
				let currentUrl = mainSteamUrl + ` (${ext})`;
				currentUrl = currentUrl.replaceAll(' ', '%20');
				currentUrl = currentUrl.replaceAll('|', '%7C');
				steamUrls.push(currentUrl);
			});
		} else {
			mainSteamUrl = mainSteamUrl.replaceAll(' ', '%20');
			mainSteamUrl = mainSteamUrl.replaceAll('|', '%7C');
			steamUrls.push(mainSteamUrl);
		}
		entry.steamUrls = steamUrls;
		return entry;
	});
	return itemList;
}
/*

*/
