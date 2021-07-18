import "./libs.js";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;

describe("sf2d.js", () => {
let worker;
	it("worker load wasm", async () => {
		worker=new Worker("sf2d.js")
		sfbkstream("file.sf2").then(({pdtaBuffer})=>{
			worker.postMessage({pdtaBuffer});
		})
		// await
		await new Promise((res, reject) => {
			worker.onmessage = ({ data: { ready } }) => (ready == 1 ? res(true) : reject());
		});
		expect(true);
	});
	it("loads rogra", async () => {


		worker.postMessage({ setProgram: { channel: 1, pid: 2 } });

		await new Promise((r) => {
			worker.onmessage = ({ data: { preset } }) => {
				expect(preset).eq(2);
				r(preset);
			};
		});
	}).timeout(200000);

});

mocha.run();
