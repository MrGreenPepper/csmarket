/** Takes an array filled with json obj as strings and converts it to js json obj
 * @param {array} 	dbArray	- array with strings convertible to json
 */
export function parseJSONArray(dbArray) {
	dbArray = dbArray.map((entry) => JSON.parse(entry));
	return dbArray;
}
