import pkg from 'pg';
import ini from 'ini';
import fs from 'fs';

async function getConnection() {
	const {native} = pkg;
	const {Client }= native;
	try {
		let dbaccess = ini.parse(fs.readFileSync('./tools/database/db.ini', 'utf-8'));
		let conClient = new Client(dbaccess['postgresql_loginData']);
		return conClient;
	} catch (error) {
		console.error(error);
		console.error(error.message);
	}
}

export async function sqlQuery(syntax, values) {	
	try {
		let client = await getConnection();
		await client.connect();
		let res = await client.query(syntax, values);

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
