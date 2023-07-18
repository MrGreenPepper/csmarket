import * as dbHandler from '../../tools/database/dbHandler.js';
import { MarketObject } from '../MarketObject.js';
import * as dbParser from '../../tools/database/parseDB.js';

let sqlSyntaxes = {
	loadItemData: 'select historicdata, orderdata from containercontent where itemname = $1',
	saveItemData: `INSERT INTO containerContent (itemname, historicData, orderData) VALUES ($1, $2, $3) 
					ON CONFLICT (itemName) DO UPDATE SET historicData=EXCLUDED.historicData, orderData=excluded.orderData;`,
};

export async function __init(containerName) {
	let containerData = await dbHandler.sqlQuery(sqlSyntaxes.loadItemData, [containerName]).then((res) => res.rows[0]);
	let steamContainer = new SteamContainer(containerName, containerData);

	return steamContainer;
}
export class SteamContainer extends MarketObject {
	constructor(containerName, containerData) {
		super();
		this.containerName = containerName;
		//rawData
		this.containerData = containerData;
		this.historicData = dbParser.parseJSONArray(containerData.historicdata);
		this.orderData = dbParser.parseJSONArray(containerData.orderdata);
		//statistics
		this.priceElasticityOrder = this.priceElasticity(this.orderData);
		this.priceElasticityTrade = this.priceElasticity(this.historicData);
		this.lifeTime = this.lifetimeContainer();
		this.historicTradeVolumnes = this.tradeVolumne(this.historicData);
		this.orderTradeVolumnes = this.tradeVolumne(this.orderData);
	}

	async updateDefault() {
		await dbHandler.sqlQuery(saveItemData, [this.containerName, this.historicData, this.orderData]);
	}

	priceElasticity(dataArray) {
		let priceElasticity = [];
		let currentElasticity;
		let currentData;
		let previousData;
		for (let i = 1; i < dataArray.length; i++) {
			previousData = dataArray[i - 1];
			currentData = dataArray[i];
			currentElasticity =
				((currentData.count - previousData.count) / (currentData.price - previousData.price)) *
				(currentData.price / previousData.price);
			priceElasticity.push(currentElasticity);
		}
		return priceElasticity;
	}

	/** it just converts the array length into a timespan,
	 * can be falsy if data approximation wasn't on and some data are missing*/
	lifetimeContainer() {
		let years = Math.floor(this.historicData.length / 356);
		let days = this.historicData.length % 356;
		let lifeTime = { years: years, days: days };
		return lifeTime;
	}

	tradeVolumne(dataArray) {
		let tradeVolumne = [];
		let currentTradeVolumne;
		let currentData;

		for (let i = 0; i < dataArray.length; i++) {
			currentData = dataArray[i];
			currentTradeVolumne = dataArray[i].count * dataArray[i].price;
			tradeVolumne.push(currentTradeVolumne);
		}
		return tradeVolumne;
	}
}
