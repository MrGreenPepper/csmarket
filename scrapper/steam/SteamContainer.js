import * as ScrappingBrowser from '../tools/scrappingBrowser.js';
import * as dbHandler from '../../tools/database/dbHandler.js';
import * as tools from './containerTools.js';
import { MarketObject } from '../MarketObject.js';

export class SteamContainer extends MarketObject {
	constructor(url) {
		this.url = url;
		this.status = { gotRawData: false };
		this.containerName;
		this.containerData;
	}

	/*	scrapes all data from the containerUrls and saves them into the individual db tables */
	async scrapData() {
		this.containerData = { historicData };
		//start browser and go to the site
		let scrappingBrowser = await ScrappingBrowser.start();
		let scrappingPage = await scrappingBrowser.newPage();
		await scrappingPage.goto(this.url);
		await scrappingPage.click('a.zoomopt[style="padding-right: 0"');
		let pageContent = await scrappingPage.content();

		let historicData = tools.pageContentToHistoricData(pageContent);
		this.containerData.historicData = historicData;
	}

	async updateDBData() {
		let sqlSyntax = '';
		let conn = dbHandler.sqlQuery();
	}
}
