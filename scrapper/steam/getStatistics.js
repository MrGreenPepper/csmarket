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
		console.log('test');
	}
}
