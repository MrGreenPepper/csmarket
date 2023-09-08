import * as scBrowser from '../tools/scrapingBrowser.js';
import * as dbHandler from '../../tools/database/dbHandler.mjs';
import * as extractor_container from './extractContainer.js';
import * as statistcs from './getStatistics.js';
import steamScraper from './scrapeSteamItem.js';
import ini from 'ini';
import fs from 'fs';

let dbAccess = ini.parse(fs.readFileSync('./tools/database/db.ini', 'utf-8'));

/**
 *
 * @param {options} renewData
 * @param {options} scrapeUrls
 * @param {options} scrapeContent
 * @param {options} convertContent
 * @param {options} scrapeWeapons
 */
export async function scrapingProtocol() {
	let protocol = {
		renewData: false,
		scrapeUrls: false,
		scrapeContainer: false,
		convertContent: false,
		scrapeWeapons: false,
		generateStatistics: false,
		extractContainerContent: false,
		calculateStatistics: false,
	};
	if (protocol.renewData) {
		await dbHandler.dropAllTables();
	}
	if (protocol.scrapeUrls) {
		await _getContainerUrls();
	}
	if (protocol.scrapeContainer) {
		await _scrapeContainers();
	}
	if (protocol.scrapeWeapons) {
		_scrapeWeapons();
	}
	if (protocol.extractContainerContent) {
		await extractor_container.extractContainerContent();
	}
	if (protocol.calculateStatistics) {
		await statistcs.getAllStatistics();
	}
}

/* scraps all container urls and saves them into the db*/
export async function _getContainerUrls() {
	let steamUrl_csgo =
		'https://steamcommunity.com/market/search?q=Container&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Quality%5B%5D=tag_normal&category_730_Rarity%5B%5D=tag_Rarity_Common&appid=730#p5_default_desc';
	let scrapingBrowser = await scBrowser.start();
	let scrapingPage = await scrapingBrowser.newPage();
	await scrapingPage.goto(steamUrl_csgo);
	//await scrapingPage.waitForNavigation();

	//get the page count
	let pageCount = await scrapingPage.$$eval('span.market_paging_pagelink', (pageLinks) => {
		//go to the last element and return the number
		let pageCount = pageLinks[pageLinks.length - 1].innerText;
		pageCount = parseInt(pageCount);
		return pageCount;
	});

	//loop threw the pages and get the itemlinks
	let itemUrls = [];
	//for (let i = 1; i <= 2; i++) {
	for (let i = 1; i <= pageCount; i++) {
		/*
		let currentURL = steamUrl_csgo;
		if (i != 0) currentURL += `#p${i}_default_desc#p8`;
		await scrapingPage.goto(currentURL);
		*/

		//get the itemLinks of the page
		let itemLinks = await scrapingPage.$$eval('#searchResultsRows a', (itemLinks) => {
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
		//go to the next page
		await scrapingPage.click('#searchResults_btn_next');
		await scrapingPage.waitForNetworkIdle();
	}

	//await dbHandler.dropAllTables();
	//TODO: createURLTable and save method
	await createLinkTable(itemUrls);
}

/**loads the containerUrls from the DB, scrapes the pageContent and filters requests for order data& saves it  */
async function _scrapeContainers() {
	let sqlSyntax_loadUrls = dbAccess['table_containerUrls'].loadAll;
	let sqlSyntax_createTable = dbAccess['table_scrapeContainer'].createTable;
	let sqlSyntax_saveRawContainer = dbAccess['table_scrapeContainer'].saveAll;
	let scrapeBrowser = await scBrowser.start();
	let scrapingPage = await scrapeBrowser.newPage();
	//get container URLS
	let containerUrls = await dbHandler.sqlQuery(sqlSyntax_loadUrls);
	containerUrls = containerUrls.rows;

	//create db for laterSave
	try {
		await dbHandler.sqlQuery(sqlSyntax_createTable);
	} catch (error) {
		//is already catched in the sqlQuery functionq
	}

	//loop, scrape and save urls rawContent

	for (let containerMeta of containerUrls) {
		let containerUrl = containerMeta.itemurl;
		try {
			let containerData = await steamScraper(containerUrl);

			await dbHandler.sqlQuery(sqlSyntax_saveRawContainer, [
				containerMeta.itemName,
				containerData.itemID,
				containerData.containerDescription,
				containerData.rawData,
				containerData.orderData,
				containerData.currentBuy,
				containerData.currentSale,
			]);

			//make a scraping break
			await new Promise((resolve) => setTimeout(resolve, 3000));
		} catch (error) {
			console.error('cant get container data');
			console.error(error);
		}
	}

	return;
}

async function scrapingDelay() {}
