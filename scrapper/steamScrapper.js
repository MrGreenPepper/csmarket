import Axios from 'axios';
import * as ScrappingBrowser from './tools/scrappingBrowser.js';
import * as dbHandler from '../tools/database/dbHandler.js';

export async function start() {
	//first scrap the standart data with the api
	// scrap all itemIDs
	let steamItemIds = await getAllItemIDs();

	let steamData = await Axios.get(
		'https://steamcommunity.com/market/priceoverview/?country=NL&currency=3&appid=578080&market_hash_name=Raglan%20T-shirt%20%28Red-White%29'
	);

	let steamSale = await Axios.get('https://steamcommunity.com/market/saleaction/ajaxgetallitemsforsale');
	// https://github.com/Revadike/InternalSteamWebAPI/wiki

	return true;
}

async function getAllItemIDs() {
	/** for all items
	let steamUrl_csgo =
		'https://steamcommunity.com/market/search?q=&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&appid=730';
*/
	let steamUrl_csgo =
		'https://steamcommunity.com/market/search?category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&appid=730&q=Waffenkiste';
	let scrappingBrowser = await ScrappingBrowser.start();
	let scrappingPage = await scrappingBrowser.newPage();
	await scrappingPage.goto(steamUrl_csgo);

	//get the page count
	let pageCount = await scrappingPage.$$eval('span.market_paging_pagelink', (pageLinks) => {
		//go to the last element and return the number
		let pageCount = pageLinks[pageLinks.length - 1].innerText;
		pageCount = parseInt(pageCount);
		return pageCount;
	});

	//loop threw the pages and get the itemlinks
	let itemUrls = [];
	for (let i = 0; i < pageCount; i++) {
		let currentURL = steamUrl_csgo;
		if (i != 0) currentURL += `#p${i}_default_desc`;
		//get the itemLinks of the page
		await scrappingPage.goto(currentURL);
		let itemLinks = await scrappingPage.$$eval('#searchResultsRows a', (itemLinks) => {
			console.log(itemLinks);
			let linkArray = itemLinks.map((currentLink) => {
				let url = currentLink.getAttribute('href');
				let divContainer = currentLink.querySelector('div[data-hash-name]');
				let dataHashName = divContainer.getAttribute('data-hash-name');
				return { url: url, hashName: dataHashName };
			});
			console.log(linkArray);
			return linkArray;
		});
		itemUrls.push(...itemLinks);
	}

	await dbHandler.dropAllTables();
	await dbHandler.createLinkTable('weaponCases', itemUrls);
	console.log(scrappingPage);
	//scrap the itemData from the individual pages
	let itemData = itemUrls.map((itemLink) => {
		let itemData;
		return itemData;
	});
}
