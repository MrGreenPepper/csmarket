import * as dbHandler from '../../tools/database/dbHandler.js';

/**
 * Calculates all statistics from the historic data.
 * Therefore it loads the historic data from the db and slices them into separated arrays.
 * Then hands over the arrays to the concerning functions to calculate the specific statistics
 *
 */

const loadRawDataTableName = 'containercontent';

/**
 * Calculates the statistics to the containers
 * 1. loads the container data
 * 2. calculates the statistics
 * 2. creates/updates single tables for the single containers containing the concerning statistic data*/
export async function getAll() {
	let sqlSyntaxes = {
		loadItemNames: 'SELECT itemname FROM containercontent;',
		loadItemContent: 'select historicdata from containercontent where itemname = $1',
		createTable: 'create table if not exists $1 ( ... )', //$1 = itemname
	};

	let itemNames = await dbHandler.sqlQuery(sqlSyntaxes.loadItemNames).then((res) => res.rows);
	//	.map((entry) => entry.itemname);
	itemNames = itemNames.map((entry) => entry.itemname);

	for (let currentName of itemNames) {
		let historicData = await dbHandler
			.sqlQuery(sqlSyntaxes.loadItemContent, [currentName])
			.then((res) => res.rows[0].historicdata);
		let dataArray = parseData(historicData);
		let lifeTime = lifetimeContainer(dataArray);
		dataArray.lifeTime = lifeTime;
		dataArray = elasticityPrice(dataArray);
		dataArray = tradeVolumne(dataArray);
		console.log('test');
		/**wanted statistcs
		 *
		 */
		//lifetime container
		//elastizität menge price
		//marktvolumen
		//handelsvolumen
		//relation markt zu handelsvolumen
		//medianPrice
		//varianz
		//.. bräuchte die angebots und nachfrage daten
	}
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
function calcMedian(dataArray, timeSpan, category) {
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

function lifetimeContainer(dataArray) {
	let years = Math.floor(dataArray.length / 356);
	let days = dataArray.length % 356;
	let lifeTime = { years: years, days: days };
	return lifeTime;
}

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
		//TODO check elastiicty and it doenst saves it in the obj
	}
	return dataArray;
}

function tradeVolumne(dataArray) {
	let currentTradeVolumne;
	let currentData;

	for (let i = 0; i < dataArray.length; i++) {
		currentData = dataArray[i];
		currentTradeVolumne = dataArray[i].count * dataArray[i].price;
		dataArray[i].tradeVolumne = currentTradeVolumne;
	}
	return dataArray;
}
function calculateMetaStatistics(dateArray, priceArray, countArray) {
	let tradeVolumne = [];
}

/**Parses the raw historic data from db into obj and splits them into separated arrays.
 * Also fixes missing days by approximating them
 * @param {array} 	historicData 	- 	the array containing every day per entry as single string
 * @param {boolean}	approximateMissingDays 	- default = true, the historic data is incomplete, instead of take care later in every single step we approximate the missing days
 * @returns {[dataArray: array} [dateArray, priceArray, countArray]		-	the parsed, splitted and cleaned data
 */
function parseData(historicData, approximateMissingDays = true) {
	let dateArray = [];
	let priceArray = [];
	let countArray = [];
	let dataArray = [];
	let dateRegex = /[a-z,A-Z]{3}.[0-9]{2}.[0-9]{4}/gim;
	let dayRegex = / [0-9]{2} /gim;
	let yearRegex = /[0-9]{4}/gim;
	let monthRegex = /[a-z,A-Z]{3}/gim;

	//split into arrays
	historicData.forEach((entry) => {
		entry = JSON.parse(entry);
		dateArray.push(entry.date);
		priceArray.push(entry.price);
		countArray.push(entry.count);
	});
	//clean the dates
	dateArray = dateArray.map((date, index) => {
		date = date.match(dateRegex)[0];
		let day = date.match(dayRegex)[0].trim();
		day = parseInt(day);
		let month = date.match(monthRegex)[0];
		let year = date.match(yearRegex)[0];
		year = parseInt(year);
		dataArray.push({ day: day, month: month, year: year, price: priceArray[index], count: countArray[index] });
		return { day: day, month: month, year: year };
	});
	//tests the data
	if (dateArray.length == priceArray.length && dateArray.length == countArray.length) {
	} else throw console.error('unmatching7 historic data');
	//approximate missing dates
	if (approximateMissingDays) dataArray = _approximateMissingDays(dataArray);

	return dataArray;
}

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
