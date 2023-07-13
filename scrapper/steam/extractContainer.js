import * as dbHandler from '../../tools/database/dbHandler.js';

function orderRawDataToOrderData(rawOrderData) {
	return;
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
		createTable: 'CREATE TABLE IF NOT EXISTS containerContent (itemname TEXT UNIQUE, historicData TEXT[]);',
		saveData: `INSERT INTO containerContent (itemname, historicData) VALUES ($1, $2) 
					ON CONFLICT (itemName) DO UPDATE SET historicData=EXCLUDED.historicData;`,
	};

	//1. create the db table if not exists
	let dbResponse = await dbHandler.sqlQuery(sqlSyntaxes.createTable);
	console.log('dbResponse - createTable:\t', dbResponse);

	let testContent = await dbHandler.sqlQuery('SELECT * from containerrawcontent');

	//2.load raw data. extract the historic data and save them into the new table
	for (let entry of itemNames.rows) {
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
		dbResponse = await dbHandler.sqlQuery(sqlSyntaxes.saveData, [currentItemName, historicData]);
		console.log('dbResponse - save historic Data:\t', dbResponse);
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
