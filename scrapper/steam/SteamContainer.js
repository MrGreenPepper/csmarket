import * as dbHandler from '../../tools/database/dbHandler.mjs';
import { MarketObject } from '../MarketObject.js';
import * as dbParser from '../../tools/database/parseDB.js';

export async function _init(containerName) {
	let sqlQueries = {
		loadItemData: {
			syntax: 'select * from containercontent where itemname = $1',
			variables: [containerName],
		},
	};
	let containerData = await dbHandler
		.sqlQuery(sqlQueries.loadItemData.syntax, sqlQueries.loadItemData.variables)
		.then((res) => res.rows[0]);
	let steamContainer = new SteamContainer(containerName, containerData);

	return steamContainer;
}
export class SteamContainer extends MarketObject {
	constructor(containerName, containerData) {
		super();
		this.containerName = containerName;
		this.concerningGame = 'counter-strike';
		//rawData
		this.plainData = containerData;
		this.historicData = dbParser.parseJSONArray(containerData.historicdata);
		this.orderData = dbParser.parseJSONArray(containerData.orderdata);
		//statistics
		this.priceElasticity = {};
		this.calcPriceElasticity('order');
		this.calcPriceElasticity('historic');
		this.lifeTime = this.lifetimeContainer();
		//calc trade volumns
		this.tradeVolumes = {};
		this.tradeVolumes.historicArray;
		this.tradeVolumes.historicSum;
		this.tradeVolumes.orderArray;
		this.tradeVolumes.orderSum;
		this.calcTradeVolumes('historic');
		this.calcTradeVolumes('order');
		this.sqlQueries = {
			saveItemData: {
				syntax: `INSERT INTO containerStatistics (itemname, historicData , orderData , priceElasticity, tradeVolumes, lifeTime) VALUES ($1, $2, $3, $4, $5, $6)
							ON CONFLICT (itemname) DO UPDATE SET
							historicData = EXCLUDED.historicData , 
							orderData = EXCLUDED.orderData , 
							priceElasticity = EXCLUDED.priceElasticity, 
							tradeVolumes = EXCLUDED.tradeVolumes, 
							lifeTime = EXCLUDED.lifeTime`,
				variables: [
					this.containerName,
					this.historicData,
					this.orderData,
					this.priceElasticity,
					this.tradeVolumes,
					this.lifeTime,
				],
			},
		};
	}

	saveDBData = async function () {
		await dbHandler.sqlQuery(this.sqlQueries.saveItemData.syntax, this.sqlQueries.saveItemData.variables);
	};

	calcPriceElasticity(dataSetName) {
		let dataArray = this[dataSetName + 'Data'];
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
			currentElasticity = parseFloat(currentElasticity.toFixed(3));
			priceElasticity.push(currentElasticity);
		}
		this.priceElasticity[dataSetName] = priceElasticity;
	}

	/** it just converts the array length into a timespan,
	 * can be falsy if data approximation wasn't on and some data are missing*/
	lifetimeContainer() {
		let years = Math.floor(this.historicData.length / 356);
		let days = this.historicData.length % 356;
		let lifeTime = { years: years, days: days };
		return lifeTime;
	}

	calcTradeVolumes(volumneName) {
		let tradeVolumnes = [];
		let currentTradeVolumne;
		let currentData;
		let dataArray;
		let dataName = volumneName + 'Data';
		let arrayName = volumneName + 'Array';
		let sumName = volumneName + 'Sum';
		//calc historic first
		dataArray = this[dataName];
		for (let i = 0; i < dataArray.length; i++) {
			currentData = dataArray[i];
			currentTradeVolumne = dataArray[i].count * dataArray[i].price;
			currentTradeVolumne = parseFloat(currentTradeVolumne.toFixed(3));
			tradeVolumnes.push(currentTradeVolumne);
		}

		this.tradeVolumes[arrayName] = tradeVolumnes;
		this.tradeVolumes[sumName] = parseFloat(tradeVolumnes.reduce((pre, cur) => (pre += cur), 0).toFixed(3));
	}
}
