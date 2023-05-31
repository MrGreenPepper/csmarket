import pg from 'pg';
import ini from 'ini';
import fs from 'fs';
import { error } from 'console';

async function getConnection() {
	try {
		let dbaccess = ini.parse(fs.readFileSync('./tools/database/db.ini', 'utf-8'));
		let client = new pg.Client(dbaccess['postgresql_loginData']);
		return client;
	} catch (error) {
		console.error(error);
		console.error(error.message);
	}
}

export async function sqlQuery(syntax) {
	try {
		let client = await getConnection();
		await client.connect();
		let res = await client.query(syntax);

		await client.end();

		return res;
	} catch (error) {
		console.error(error.stack);
	}
}
export async function dropAllTables() {
	await sqlQuery(`DROP SCHEMA public CASCADE;`);
	await sqlQuery(`CREATE SCHEMA public;`);
}

/**
 * creates a new postgres table for items and the concerning links.
 * REPLACES possible previous ones
 *
 * @param {string} tableName 	name of the table
 * @param {array} data		{url, hashname}
 * @returns true
 */
export async function createLinkTable(tableName, data) {
	//check if the table exists, if so delete it
	try {
		await dropAllTables();
	} catch (error) {
		console.log(error);
	}

	//create a new table
	try {
		let createTableSyntax = `CREATE TABLE ${tableName} (number serial PRIMARY KEY, itemName TEXT, itemUrl TEXT);`;

		//await dbConnection(createTableSyntax);
		await sqlQuery(createTableSyntax);
	} catch (error) {
		console.log(error);
		console.log(error.message);
	}

	//insert the data into the table
	let insertSyntax = `INSERT INTO ${tableName} (itemName, itemUrl) VALUES (`;

	for (let i = 0; i < data.length; i++) {
		let itemData = data[i];
		let currentSyntax = insertSyntax;
		currentSyntax += "'" + itemData.hashName + "'" + ', ';
		currentSyntax += "'" + itemData.url + "'";
		currentSyntax += ');';
		await sqlQuery(currentSyntax);
	}

	return true;
}
