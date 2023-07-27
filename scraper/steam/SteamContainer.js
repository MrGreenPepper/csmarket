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
		this.currentPrices = containerData.currentprices;
		//statistics
		this.priceElasticity = {};
		this.calcPriceElasticity('order');
		this.calcPriceElasticity('historic');
		this.lifeTime = this.lifetimeContainer();
		//calc trade volumns
		/**welche statistiken mächte ich haben?:
		 * wo war das tradevolumen am grö§ten? __> sorted array
		 */
		this.statistics = {};
		this.statistics.historic = {};
		this.statistics.historic.data = this.historicData;
		this.statistics.historic.tradeVolumes = this.calcTradeVolumes(this.historicData);
		Object.assign(this.statistics.historic, this.calcBasicStatistics(this.historicData));

		this.statistics.order = {};
		this.statistics.order.buy = {};
		this.statistics.order.sale = {};
		this.sortBuyVolume();
		this.sortSaleVolume();
		this.statistics.order.buy.tradeVolumes = {};
		this.statistics.order.sale.tradeVolumes = {};

		this.statistics.order.buy.tradeVolumes = this.calcTradeVolumes(this.statistics.order.buy.data);
		Object.assign(this.statistics.order.buy, this.calcBasicStatistics(this.statistics.order.buy.data));
		this.statistics.order.sale.tradeVolumes = this.calcTradeVolumes(this.statistics.order.sale.data);
		Object.assign(this.statistics.order.sale, this.calcBasicStatistics(this.statistics.order.sale.data));

		this.sqlQueries = {
			saveItemData: {
				syntax: `INSERT INTO containerStatistics (itemname, historicData , orderData , priceElasticity, statistics, lifeTime, currentprices) VALUES ($1, $2, $3, $4, $5, $6, $7)
							ON CONFLICT (itemname) DO UPDATE SET
							historicData = EXCLUDED.historicData , 
							orderData = EXCLUDED.orderData , 
							priceElasticity = EXCLUDED.priceElasticity, 
							statistics = EXCLUDED.statistics, 
							lifeTime = EXCLUDED.lifeTime,
							currentprices = EXCLUDED.currentprices`,
				variables: [
					this.containerName,
					this.historicData,
					this.orderData,
					this.priceElasticity,
					this.statistics,
					this.lifeTime,
					this.currentPrices,
				],
			},
		};
	}

	saveDBData = async function () {
		await dbHandler.sqlQuery(this.sqlQueries.saveItemData.syntax, this.sqlQueries.saveItemData.variables);
	};
	sortBuyVolume() {
		this.statistics.order.buy.data = this.orderData.filter((entry) => {
			if (entry.orderType == 'buy') return true;
		});
	}
	sortSaleVolume() {
		this.statistics.order.sale.data = this.orderData.filter((entry) => {
			if (entry.orderType == 'sell') return true;
		});
	}
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

	calcBasicStatistics(dataArray) {
		let statistics = {};
		let countSum = dataArray.reduce((pre, cur) => (pre += cur.count), 0);
		let medianData = {};
		//calc median and quartiles
		let medianCounter = 0;
		let foundMedian = false;
		for (let i = 0; i < dataArray.length; i++) {
			medianCounter += dataArray[i].count;
			if (medianCounter >= countSum / 2 && foundMedian == false) {
				foundMedian = true;
				medianData.entry = dataArray[i];
				medianData.i = i;
			}
		}
		statistics.countSum = countSum;
		statistics.medianData = medianData;

		return statistics;
	}

	calcTradeVolumes(currentData) {
		let tradeVolumeSum = 0;
		let dataArray;
		let sortByDate;
		let sortByPrice;
		let sortByVolume;
		let sortByCount;
		let countSum = 0;
		let medianData = {};

		//calc volume, sumVolume & sumCount
		dataArray = currentData;
		for (let i = 0; i < dataArray.length; i++) {
			dataArray[i].volume = dataArray[i].count * dataArray[i].price;
			dataArray[i].volume = parseFloat(dataArray[i].volume.toFixed(3));
			//add count
			countSum += dataArray[i].count;
			tradeVolumeSum += dataArray[i].count * dataArray[i].price;
		}
		tradeVolumeSum = parseFloat(tradeVolumeSum.toFixed(3));

		//sort differnt types of arrays
		sortByDate = dataArray;
		sortByPrice = dataArray.sort((a, b) => a.price - b.price);
		sortByVolume = dataArray.sort((a, b) => a.volume - b.volume);
		sortByCount = dataArray.sort((a, b) => a.count - b.count);

		return {
			tradeVolumeSum: tradeVolumeSum,
			countSum: countSum,
			sortByDate: dataArray,
			sortByPrice: sortByPrice,
			sortByVolume: sortByVolume,
			sortByCount: sortByCount,
		};
	}
}
