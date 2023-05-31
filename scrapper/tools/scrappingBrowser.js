import Puppeteer from 'puppeteer';

export async function start() {
	let browser;

	browser = await Puppeteer.launch({
		headless: 'new',
		devtools: true,
		defaultViewport: null,
		args: [
			'--disable-infobars',
			//'--display=1'
		],
	});
	return browser;
}
