import * as scBrowser from '../tools/scrapingBrowser.js';

/** tries to scrape steam items
 * @param {string} 	itemUrl  	the steam url for the requested item
 * @returns {object}	itemData	contains {itemName, itemID, itemDescription, rawData, orderData, currentBuy, currenSale}
 */

export default async function scrapeSteamItem(itemUrl) {
	try {
		itemUrl = 'https://steamcommunity.com/market/listings/730/Dreams%20%26%20Nightmares%20Caseasdf';
		let scrapeBrowser = await scBrowser.start();
		let scrapingPage = await scrapeBrowser.newPage();

		let itemName;
		let itemID = '';

		let orderData;
		let orderUrl;
		let rawData;
		let currentSale = 'no orders';
		let currentBuy = 'no orders';
		let containerDescription = [];

		//first get orderUrl cause its fetched when loading the page
		orderUrl = await getOrderUrl(scrapingPage, itemUrl);

		//get the itemID out of the orderUrl
		itemID = getItemID(orderUrl);

		await scrapingPage.waitForNetworkIdle();
		//get the itemName
		itemName = await getItemName(scrapingPage);

		//get rawHTML as backup for later
		rawData = await getRawHTML(scrapingPage);
		//try getting currentPrices ... need to wait until page loaded dynamic contents too
		[currentBuy, currentSale] = await scrapePrices(scrapingPage);

		//get the containerItems
		containerDescription = await getDescription(scrapingPage);

		//now change the url to orderUrl and get the orderData
		orderData = await getOrderData(scrapingPage, orderUrl);

		await scrapeBrowser.close();

		return {
			itemName: itemName,
			itemID: itemID,
			containerDescription: containerDescription,
			rawData: rawData,
			orderData: orderData,
			currentBuy: currentBuy,
			currentSale: currentSale,
		};
	} catch (error) {
		console.error('cant get item data');
		console.error(error);
	}
}

/**gets the itemName from the side */
async function getItemName(scrapingPage) {
	let itemName = scrapingPage.$eval('div.item_desc_description h1', (res) => res.innerText);
	return itemName;
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

/** goes to the required page and catches the orderUrl from the api */
async function getOrderUrl(scrapingPage, itemUrl) {
	let requestUrlRegEx = /(steamcommunity\.com\/market\/itemordershistogram\?)/gim;
	let orderURL;

	//get the orderData api url
	await scrapingPage.setRequestInterception(true);

	let foundOrderUrl = false;

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
	await scrapingPage.goto(itemUrl, { timeout: 30000 });

	// set a emergency timeout if side doesn't work, scraping the page will fail but then it goes on with the next one instead of waiting for ever

	await waitForOrderUrl(foundOrderUrl);
	return orderURL;
}

async function getOrderData(scrapingPage, orderURL) {
	let orderData;
	//go to the scraped order url
	await scrapingPage.goto(orderURL);
	await scrapingPage.waitForNetworkIdle();

	orderData = await scrapingPage.content();

	return orderData;
}

function waitForOrderUrl(variable) {
	return new Promise((resolve) => {
		const emergencyTimeout = setInterval(() => {
			clearInterval(emergencyTimeout);
			resolve();
		}, 10000);
		const interval = setInterval(() => {
			if (variable === true) {
				clearInterval(interval);
				resolve();
			}
		}, 100);
	});
}

/** get the raw html from the side, just as backup */
async function getRawHTML(scrapingPage) {
	await scrapingPage.waitForSelector('span.market_commodity_orders_header_promote');
	let rawData = await scrapingPage.content();

	return rawData;
}

/** slices the itemID out of the orderUrl */
function getItemID(orderUrl) {
	let itemIDregEx = /(?<=item_nameid=).*(?=&)/gim;
	let itemID = parseInt(orderUrl.match(itemIDregEx));
	return itemID;
}
