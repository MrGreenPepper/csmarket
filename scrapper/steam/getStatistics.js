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
		let [dateArray, priceArray, countArray] = splitIntoSingleArrays(historicData);
		console.log('test');
		/**wanted statistcs
		 *
		 */
		//lifetime container
		//elastizität menge price
		//martvolumen
		//handelsvolumen
		//relation markt zu handelsvolumen
		//.. bräuchte die angebots und nachfrage daten
	}
}

/**Parses the raw historic data from db into obj and splits them into separated arrays.
 * Also fixes missing days by approximating them
 * @param {array} 	historicData 	- 	the array containing every day per entry as single string
 * @param {boolean}	approximateMissingDays 	- default = true, the historic data is incomplete, instead of take care later in every single step we approximate the missing days
 * @returns {[dates:array, prices:array, count:arrayx]} [dateArray, priceArray, countArray]		-	the parsed, splitted and cleaned data
 */
function splitIntoSingleArrays(historicData, aproximateMissingDays = true) {
	let dateArray = [];
	let priceArray = [];
	let countArray = [];
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
	dateArray = dateArray.map((date) => {
		date = date.match(dateRegex)[0];
		let day = date.match(dayRegex)[0].trim();
		day = parseInt(day);
		let month = date.match(monthRegex)[0];
		let year = date.match(yearRegex)[0];
		year = parseInt(year);
		return { day: day, month: month, year: year };
	});
	//tests the data
	if (dateArray.length == priceArray.length && dateArray.length == countArray.length) {
	} else throw console.error('incomplete historic data');
	//approximate missing dates
	[dateArray, priceArray, countArray] = approximateMissingDays([dateArray, priceArray, countArray]);

	return [dateArray, priceArray, countArray];
}

function approximateMissingDays([dateArray, priceArray, countArray]) {
	let fixedDateArray = [];
	let fixedPriceArray = [];
	let fixedCountArray = [];
	//find missing days
	for (let i = 0; i < dateArray.length - 1; i++) {
		//first push origin
		fixedDateArray.push(dateArray[i]);
		fixedPriceArray.push(priceArray[i]);
		fixedCountArray.push(countArray[i]);
		//TODO correct month lengths (the last months had realy end)
		//TODO: think about approximating the price like that (peak days) ... maybe missing days before peak days
		if (dateArray[i].day + 1 != dateArray[i + 1].day && dateArray[i].month == dateArray[i + 1].month) {
			//count missing days
			let missingDays = dateArray[i + 1].day - dateArray[i].day - 1;
			let countChange = countArray[i + 1] - countArray[i];
			let countChangePerDay = countChange / missingDays;
			let priceChange = priceArray[i + 1] - priceArray[i];
			let priceChangePerDay = priceChange / missingDays;
			for (let n = 1; n <= missingDays; n++) {
				let currentDay = dateArray[i].day + n;
				let currentDate = { day: currentDay, month: dateArray[i].month, year: dateArray[i].year };
				let currentPrice = priceArray[i] + n * priceChangePerDay;
				let currentCount = countArray[i] + n * countChangePerDay;
				fixedDateArray.push(currentDate);
				fixedPriceArray.push(currentPrice);
				fixedCountArray.push(currentCount);
			}
		}
	}
	return [fixedDateArray, fixedPriceArray, fixedCountArray];
}
