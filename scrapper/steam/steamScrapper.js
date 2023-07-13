import * as scBrowser from '../tools/scrappingBrowser.js';
import * as dbHandler from '../../tools/database/dbHandler.js';
import * as extractor_container from './extractContainer.js';
import * as statistcs from './getStatistics.js';
import Puppeteer from 'puppeteer';

/**
 *
 * @param {options} renewData
 * @param {options} scrapeUrls
 * @param {options} scrapeContent
 * @param {options} convertContent
 * @param {options} scrapeWeapons
 */
export async function scrappingProtocol({
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
		extractor_container.extractContainerContent();
	}
	if (calculateStatistics) {
		await statistcs.getAll();
	}
}

/* scraps all container urls and saves them into the db*/
export async function _getContainerUrls() {
	let steamUrl_csgo =
		'https://steamcommunity.com/market/search?q=Container&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Quality%5B%5D=tag_normal&category_730_Rarity%5B%5D=tag_Rarity_Common&appid=730#p5_default_desc';
	let scrappingBrowser = await scBrowser.start();
	let scrappingPage = await scrappingBrowser.newPage();
	await scrappingPage.goto(steamUrl_csgo);
	//await scrappingPage.waitForNavigation();

	//get the page count
	let pageCount = await scrappingPage.$$eval('span.market_paging_pagelink', (pageLinks) => {
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
		await scrappingPage.goto(currentURL);
		*/

		//get the itemLinks of the page
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
		//go to the next page
		await scrappingPage.click('#searchResults_btn_next');
		await scrappingPage.waitForNetworkIdle();
	}

	//await dbHandler.dropAllTables();
	await createLinkTable(itemUrls);
}

/**
 * creates a new postgres table for items and the concerning links.
 * REPLACES possible previous ones
 *
 * @param {string} tableName 	name of the table
 * @param {array} data		{url, hashName}
 * @returns true
 */
async function _createLinkTable(data) {
	let tableName = 'containerurls';
	//check if the table exists, if so delete it
	/*
	try {
		await dbHandler.dropAllTables();
	} catch (error) {
		console.log(error);
	}
*/

	//create a new table
	try {
		let createTableSyntax = `CREATE TABLE IF NOT EXISTS ${tableName} (number serial PRIMARY KEY, itemName TEXT UNIQUE, itemUrl TEXT);`;

		//await dbConnection(createTableSyntax);
		await dbHandler.sqlQuery(createTableSyntax);
	} catch (error) {
		console.log(error);
		console.log(error.message);
	}

	//insert the data into the table
	//let insertSyntax = `INSERT INTO ${tableName} (itemName, itemUrl) VALUES ($1, $2)`;
	let insertSyntax = `INSERT INTO containerurls (itemName, itemUrl) VALUES ($1, $2)
						ON CONFLICT (itemName) DO UPDATE SET itemUrl=EXCLUDED.itemUrl;`;

	for (let i = 0; i < data.length; i++) {
		let itemData = data[i];
		await dbHandler.sqlQuery(insertSyntax, [itemData.hashName, itemData.url]);
	}
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

/**loads the containerUrls from the DB, scrapes the pageContent & saves it  */
async function _scrapeContainers() {
	let loadSQLSyntax = 'SELECT * FROM containerurls;';
	let createRawTableSyntax = `CREATE TABLE IF NOT EXISTS containerRawContent (itemName TEXT UNIQUE, pageContent TEXT, orderData TEXT);`;
	let scrapeBrowser = await scBrowser.start();
	let scrappingPage = await scrapeBrowser.newPage();
	let saveSQLSyntax = `INSERT INTO containerRawContent (itemName, pagecontent, orderData) VALUES ($1, $2, $3) 
						ON CONFLICT (itemName) DO UPDATE SET pageContent=EXCLUDED.pageContent, orderData = EXCLUDED.orderData;`;

	//get container URLS
	let containerUrls = await dbHandler.sqlQuery(loadSQLSyntax);
	containerUrls = containerUrls.rows;

	//create db for laterSave
	try {
		dbHandler.sqlQuery(createRawTableSyntax);
	} catch (error) {
		//is already catched in the sqlQuery functionq
	}

	//loop, scrape and save urls rawContent

	for (let containerMeta of containerUrls) {
		try {
			let scrappingPage = await scrapeBrowser.newPage();

			let requestUrlRegEx = /(steamcommunity\.com\/market\/itemordershistogram\?)/gim;
			let foundOrderUrl = false;
			let orderURL;
			let orderURLPromise = new Promise((resolve) => {
				if (foundOrderUrl) resolve(orderURL);
			});
			let orderData;
			let rawData;

			await scrappingPage.setRequestInterception(true);

			scrappingPage.on('request', (request) => {
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

			await scrappingPage.goto(containerMeta.itemurl, { timeout: 0 });
			await waitForOrderUrl(foundOrderUrl);
			/*try {
				await scrappingPage.waitForSelector(
					'div#orders_histogram.jqplot-target div.jqplot-highlighter-tooltip'
				);
			} catch {}*/
			rawData = await scrappingPage.content();

			//go to the scraped order url
			await scrappingPage.goto(orderURL);
			await scrappingPage.waitForNetworkIdle();
			orderData = await scrappingPage.content();
			await scrappingPage.close();
			await dbHandler.sqlQuery(saveSQLSyntax, [containerMeta.itemname, rawData, orderData]);
		} catch (error) {
			console.error('cant get container data');
			console.error(error);
		}
	}

	return;
}

function delay(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

const delay2 = (ms) => new Promise((res) => setTimeout(res, ms));

async function scrapeWeapons() {}
