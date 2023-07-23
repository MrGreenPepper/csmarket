import * as dbHandler from '../../tools/database/dbHandler.mjs';

/** Cuts the order data out of the raw page content. first slice the raw text then parses it into json
 * finishes by filtering the data
 */
function orderRawDataToOrderData(rawOrderData) {
	let sliceRegex = /(?<=buy_order_graph":\[\[).*(?=\]\])/gim;
	let plainTextArray;
	let rawArray;
	let orderData;

	//cut the concerning part
	rawOrderData = rawOrderData.replaceAll('\\', '');
	rawOrderData = rawOrderData.replaceAll('/', '');
	plainTextArray = rawOrderData.match(sliceRegex)[0];

	//parse it into JSON
	rawArray = plainTextArray.split('],[');

	//filter the necessary data
	rawArray = rawArray.map((entry) => {
		let price;
		let count;
		let orderType;
		entry = entry.replaceAll("'", '');
		entry = entry.replaceAll('"', '');
		entry = entry.split(',');
		price = parseFloat(entry[0]);
		count = parseInt(entry[1]);
		orderType = entry[2].includes('Verkauf') ? 'sell' : 'buy';
		return { price: price, count: count, orderType: orderType };
	});
	orderData = rawArray.sort((a, b) => a.price - b.price);

	return orderData;
}
/**
 * 1. Try to create a new table (containerContent)
 * 2. Loads the raw steam container page contents and extracts the historic data from it.
 * 3. Searches in the pageContent string for the spot with the historic data and extracts them into an array.
 * 4. Inserts/updates the itemname entry with the concerning historic data
 */
export async function extractContainerContent() {
	let itemNames = await dbHandler.sqlQuery('SELECT itemname FROM containerurls');
	let sqlSyntaxes = {
		loadContent: 'SELECT pagecontent, orderdata FROM containerrawcontent WHERE itemname = $1;',
		createTable:
			'CREATE TABLE IF NOT EXISTS containerContent (itemname TEXT UNIQUE, historicData TEXT[], orderData TEXT[]);',
		saveData: `INSERT INTO containerContent (itemname, historicData, orderData) VALUES ($1, $2, $3) 
					ON CONFLICT (itemName) DO UPDATE SET historicData=EXCLUDED.historicData, orderData=excluded.orderData;`,
	};

	//1. create the db table if not exists
	let dbResponse = await dbHandler.sqlQuery(sqlSyntaxes.createTable);
	console.log('dbResponse - createTable:\t', dbResponse);

	//2.load raw data. extract the historic data and save them into the new table
	for (let entry of itemNames.rows) {
		try {
			//load raw data
			let currentItemName = entry.itemname;
			let currentItemRawData = await dbHandler.sqlQuery(sqlSyntaxes.loadContent, [currentItemName]);

			let pageContentRaw = currentItemRawData.rows[0].pagecontent;
			let orderDataRaw = currentItemRawData.rows[0].orderdata;

			//3. extract the data
			let historicData = pageContentToHistoricData(pageContentRaw);
			let orderData = orderRawDataToOrderData(orderDataRaw);
			console.log('');
			//4. save into the new table
			dbResponse = await dbHandler.sqlQuery(sqlSyntaxes.saveData, [currentItemName, historicData, orderData]);
			console.log('dbResponse - save historic Data:\t', dbResponse);
		} catch (error) {
			console.error('cant extract data from item:\t', entry, '\n');
			console.error(error.message);
			console.error(error.stack);
		}
	}
}

/** slices the historic graph data out of the html source code
 * @param	{string} pageContent - the raw html from the page
 * @returns {array} historicData - array with the historic data containing obj with keys {date, price, count}
 */
function pageContentToHistoricData(pageContent) {
	let dataArrayRegex = /(?<=var line1=).*?(?=;)/gim;
	let stringData = dataArrayRegex.exec(pageContent);
	let historicData;
	historicData = stringData[0].split('"],["');
	historicData = historicData.map((currentData) => {
		let littleArray = currentData.split(',');
		littleArray = littleArray.map((currentElement) => {
			currentElement = currentElement.replace(/\"/gm, '');
			currentElement = currentElement.replace(/\'/gm, '');
			currentElement = currentElement.replace(/\[/gm, '');
			currentElement = currentElement.trim();

			try {
				if (!isNaN(parseFloat(currentElement))) currentElement = parseFloat(currentElement);
			} catch {}
			return currentElement;
		});

		littleArray = { date: littleArray[0], price: littleArray[1], count: littleArray[2] };
		return littleArray;
	});

	return historicData;
}
