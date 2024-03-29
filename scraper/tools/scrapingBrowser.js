import Puppeteer from 'puppeteer';

export async function start() {
	let browser;

	browser = await Puppeteer.launch({
		headless: false,
		devtools: true,
		defaultViewport: null,
		args: [
			'--disable-infobars',
			'--window-size=1920,1080',
			//	'--window-position=4920,0',
			//'--display=1'
		],
	});
	return browser;
}
