import puppeteer from "puppeteer";

(async () => {
	const browser = await puppeteer.launch({headless: "new"});
	const page = await browser.newPage();

	await page.goto('http://localhost/sf2rend/spin/test.html');
	console.log(await page.title())


	await browser.close();
})();