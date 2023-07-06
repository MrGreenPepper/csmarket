//OLD -->

import * as ScrappingBrowser from '../tools/scrappingBrowser.js';
import * as dbHandler from '../../tools/database/dbHandler.js';

/* slices the historic graph data out of the html source code*/
export function pageContentToHistoricData(pagecontent) {
	let dataArrayRegex = /(?<=var line1=).*?(?=;)/gim;
	let stringData = dataArrayRegex.exec(pagecontent);
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
