// import puppeteer from "puppeteer";
import {mkspinner} from "./index.js";
const sp = await mkspinner()
// (async () => {
// 	const browser = await puppeteer.launch({headless: "new"});
// 	const page = await browser.newPage();

// 	await page.goto('http://localhost/sf2rend/spin/test.html');
// 	console.log(await page.title())


// 	await browser.close();
// })();
console.log(sp.spinners[0]);
console.log(sp.new_sp());