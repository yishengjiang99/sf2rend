import puppeteer from "puppeteer";
(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await page.goto('http://localhost:3000/test.html');
	page.on('request', interceptedRequest => {
		if (interceptedRequest.isInterceptResolutionHandled()) return;
		if (
			interceptedRequest.url().endsWith('.png') ||
			interceptedRequest.url().endsWith('.jpg')
		) { }
		//interceptedRequest.abort();
		else interceptedRequest.continue();
	});

	page
		.on('console', message =>
			console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
		.on('pageerror', ({message}) => console.log(message))
		.on('response', response =>
			console.log(`${response.status()} ${response.url()}`))
		.on('requestfailed', request =>
			console.log(`${request.failure().errorText} ${request.url()}`))


	// Set screen size
	await page.setViewport({width: 1080, height: 1024});
})();