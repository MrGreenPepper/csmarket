import * as dbHandler from '../../tools/database/dbHandler.mjs';
import * as dbParser from '../../tools/database/parseDB.js';
import * as SteamContainer from './SteamContainer.js';
import dbSyntaxes from '../../tools/database/dbSyntaxes.js';
/**
 * Calculates all statistics from the historic data.
 * Therefore it loads the historic data from the db and slices them into separated arrays.
 * Then hands over the arrays to the concerning functions to calculate the specific statistics
 *
 */

const loadRawDataTableName = 'containercontent';

/**
 * Calculates the statistics to the containers
 * 1. loads the container names
 * 2. creates an containerObject
 * 3. the container object calculates the statistics on hisself
 * 2. creates/updates tables for the single containers containing the concerning statistic data*/
export async function getAllStatistics() {
	let itemNames;

	//getting the itemNames
	try {
		itemNames = await dbHandler.sqlQuery(dbSyntaxes.table_extractContainer.loadNames).then((res) => res.rows);
		itemNames = itemNames.map((entry) => entry.itemname);
	} catch (error) {
		console.log('cant load itemnames for statistical calc loop');
		console.log(error.message);
		console.log(error.stack);
	}

	//create the statistics table
	try {
		let res = await dbHandler.sqlQuery(dbSyntaxes.table_containerStatistics.createTable);
		console.log(res);
	} catch (error) {
		console.log(error);
	}

	//create class container for everydata ... calcs happen in the class
	for (let currentName of itemNames) {
		let currentContainer = await SteamContainer._init(currentName);
		await saveDBData.bind(currentContainer)();
		//await currentContainer.saveDBData();
	}
}

async function saveDBData() {
	await dbHandler.sqlQuery(dbSyntaxes.table_containerStatistics.saveAll, this.sqlQueries.saveItemData.variables);
	return;
}

/**calculates different medians for the given category*/
function allMedians(dataArray) {}

/** calculates the median prices depending on the given timespan.
 * The timespan can be a single value, then its from now, or an array with 2 number with start and end day count from now.
 * @param {array}	dataArray - the array containing the obj, containing the data for the specific day
 * @param {} timeSpan - (2 number array or 1 single number) the timespan (from now into the past) for calculating the median
 * @param {string} category - keyName in the dataArray - Entries to calculate with
 * @returns {array} dataArray - with median#timeSpan as key
 */
function calcMedian() {
	let median;
	let medianObj;
	let values = [];
	let startDate = Array.isArray(timeSpan) ? dataArray.length - timeSpan[0] : dataArray.length - timeSpan;
	let endDate = dataArray.length - Array.isArray(timeSpan) ? timeSpan[1] : dataArray.length;
	let medianName = `median_${category}_${timeSpan}`;

	for (let i = startDate; i < endDate; i++) {
		values.push(dataArray[i][category]);
	}
	if (values.length % 2 == 0) {
		let middleLength = values.length / 2;
		median = (values[middleLength] + values[middleLength + 1]) / 2;
	} else {
		median = values[Math.floor(values.length / 2) + 1];
	}
	dataArray[medianName] = median;
	return dataArray;
}
function priceVariation(dataArray, timeSpan) {}

function elasticityPrice(dataArray) {
	//TODO: error 2347/2348 ... check NaN
	let currentElasticity;
	let currentData;
	let previousData;
	for (let i = 1; i < dataArray.length; i++) {
		previousData = dataArray[i - 1];
		currentData = dataArray[i];
		currentElasticity =
			((currentData.count - previousData.count) / (currentData.price - previousData.price)) *
			(currentData.price / previousData.price);
		dataArray[i].priceElasticity = currentElasticity;
	}
	return dataArray;
}

function tradeVolume(dataArray) {
	let currentTradeVolume;
	let currentData;

	for (let i = 0; i < dataArray.length; i++) {
		currentData = dataArray[i];
		currentTradeVolume = dataArray[i].count * dataArray[i].price;
		dataArray[i].tradeVolume = currentTradeVolume;
	}
	return dataArray;
}
function calculateMetaStatistics(dateArray, priceArray, countArray) {
	let tradeVolume = [];
}

/**Parses the raw historic data from db into obj and splits them into separated arrays.
 * Also fixes missing days by approximating them
 * @param {array} 	historicData 	- 	the array containing every day per entry as single string
 * @param {boolean}	approximateMissingDays 	- default = true, the historic data is incomplete, instead of take care later in every single step we approximate the missing days
 * @returns {[dataArray: array} [dateArray, priceArray, countArray]		-	the parsed, splitted and cleaned data
 */

function _approximateMissingDays(dataArray) {
	let fixedDataArray = [];
	//find missing days
	for (let i = 0; i < dataArray.length - 1; i++) {
		//first push origin
		fixedDataArray.push(dataArray[i]);
		//TODO correct month lengths (the last months had realy end)
		//TODO: think about approximating the price like that (peak days) ... maybe missing days before peak days
		if (dataArray[i].day + 1 != dataArray[i + 1].day && dataArray[i].month == dataArray[i + 1].month) {
			//count missing days
			let missingDays = dataArray[i + 1].day - dataArray[i].day - 1;
			let countChange = dataArray[i + 1].count - dataArray[i].count;
			let countChangePerDay = countChange / missingDays;
			let priceChange = dataArray[i + 1].price - dataArray[i].price;
			let priceChangePerDay = priceChange / missingDays;
			for (let n = 1; n <= missingDays; n++) {
				let currentDay = dataArray[i].day + n;
				let currentDate = { day: currentDay, month: dataArray[i].month, year: dataArray[i].year };
				let currentPrice = dataArray[i].price + n * priceChangePerDay;
				let currentCount = dataArray[i].count + n * countChangePerDay;
				fixedDataArray.push({
					day: currentDay,
					month: dataArray[i].month,
					year: dataArray[i].year,
					price: currentPrice,
					count: currentCount,
				});
			}
		}
	}
	return fixedDataArray;
}
