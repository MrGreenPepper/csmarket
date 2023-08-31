import * as scBrowser from '../tools/scrapingBrowser.js';
import * as dbHandler from '../../tools/database/dbHandler.mjs';
import * as extractor_container from './extractContainer.js';
import * as statistcs from './getStatistics.js';
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
export async function scrapingProtocol({
	renewData = false,
	scrapeUrls = true,
	scrapeContainer = true,
	convertContent = true,
	scrapeWeapons = false,
	generateStatistics = true,
	extractContainerContent = true,
	calculateStatistics = true,
}) {
	if (renewData) {
		await dbHandler.dropAllTables();
	}
	if (scrapeUrls) {
		await _getContainerUrls();
	}
	if (scrapeContainer) {
		await _scrapeContainers();
	}
	if (scrapeWeapons) {
		_scrapeWeapons();
	}
	if (extractContainerContent) {
		await extractor_container.extractContainerContent();
	}
	if (calculateStatistics) {
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
	for (let i = 1; i <= 2; i++) {
		//for (let i = 1; i <= pageCount; i++) {
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

function waitForOrderUrl(variable) {
	return new Promise((resolve) => {
		const interval = setInterval(() => {
			if (variable === true) {
				clearInterval(interval);
				resolve();
			}
		}, 100);
	});
}

/**loads the containerUrls from the DB, scrapes the pageContent and filters requests for order data& saves it  */
async function _scrapeContainers() {
	let sqlSyntax_loadUrls = dbAccess['table_containerUrls'].loadAll;
	let sqlSyntax_createTable = dbAccess['table_scrapeContainer'].createTable;
	let sqlSyntax_saveContainer = dbAccess['table_scrapeContainer'].saveAll;
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
		try {
			let scrapingPage = await scrapeBrowser.newPage();

			let requestUrlRegEx = /(steamcommunity\.com\/market\/itemordershistogram\?)/gim;
			let itemIDregEx = /(?<=item_nameid=).*(?=&)/gim;
			let itemID = '';
			let foundOrderUrl = false;
			let orderURL;

			let orderData;
			let rawData;
			let currentSale = 'no orders';
			let currentBuy = 'no orders';
			let containerDescription = [];

			//get the orderData api url
			await scrapingPage.setRequestInterception(true);

			scrapingPage.on('request', (request) => {
				let currentURL = request.url();
				console.log(currentURL);
				if (!foundOrderUrl) {
					if (currentURL.match(requestUrlRegEx)) {
						foundOrderUrl = true;
						orderURL = currentURL;
					}
				}
				if (['image', 'media', 'font'].indexOf(request.resourceType()) !== -1) {
					return request.abort();
				}
				request.continue();
			});

			await scrapingPage.goto(containerMeta.itemurl, { timeout: 0 });
			await waitForOrderUrl(foundOrderUrl);
			/*try {
				await scrapingPage.waitForSelector(
					'div#orders_histogram.jqplot-target div.jqplot-highlighter-tooltip'
				);
			} catch {}*/

			//try getting currentPrices ... need to wait until page loaded dynamic contents too
			await scrapingPage.waitForSelector('span.market_commodity_orders_header_promote');
			rawData = await scrapingPage.content();
			[currentBuy, currentSale] = await scrapePrices(scrapingPage);

			//get the containerItems
			containerDescription = await getDescription(scrapingPage);

			//go to the scraped order url
			await scrapingPage.goto(orderURL);
			await scrapingPage.waitForNetworkIdle();
			itemID = parseInt(orderURL.match(itemIDregEx));
			orderData = await scrapingPage.content();
			await scrapingPage.close();
			await dbHandler.sqlQuery(sqlSyntax_saveContainer, [
				containerMeta.itemname,
				itemID,
				containerDescription,
				rawData,
				orderData,
				currentBuy,
				currentSale,
			]);
		} catch (error) {
			console.error('cant get container data');
			console.error(error);
		}
	}

	return;
}

/**
 * Scraps the item description. The desciption contains some release data and the contained items
 *
 * @param {*} scrapingPage
 * @returns
 */
async function getDescription(scrapingPage) {
	let containedItems;

	containedItems = await scrapingPage.$$eval('div.item_desc_descriptors div.descriptor[style]', (res) => {
		console.log(res);
		console.log(res[0].attributes);
		let descriptorList = [...res];
		descriptorList = descriptorList.map((entry) => {
			let outerHTML = entry.outerHTML;
			let innerText = entry.innerText;
			let style = entry.attributes.style.value;
			return { outerHTML: outerHTML, innerText: innerText, style: style };
		});

		return descriptorList;
	});

	return containedItems;
}
async function scrapePrices(scrapingPage) {
	let currentSale = 'no orders';
	let currentBuy = 'no orders';
	await scrapingPage;
	try {
		currentSale = await scrapingPage.$eval('#market_commodity_forsale', (res) => res.innerText);
	} catch {}
	try {
		currentBuy = await scrapingPage.$eval('#market_commodity_buyrequests', (res) => res.innerText);
	} catch {}

	return [currentBuy, currentSale];
}

async function scrapeWeapons() {}
