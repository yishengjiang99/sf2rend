import {wsmodule, mkInstance} from "../spin2.js";
let mm
describe('spin wasm', () => {
	before(async () => {
		mm = await wsmodule();
	});

	it('wasm loaded', async () => {
		expect(mm.module).to.exist;
	});
	it("can instantiate", async () => {
		const instance = await mkInstance();
		expect(instance.exports).to.exist;
		const after = performance.now();
		const {timecent2sample} = instance.exports;
		expect(timecent2sample(1200)).eq(88200);
	});
	it("can share memory", async () => {
		const [i1, i2] = [await mkInstance(), await mkInstance()];
		debugger;
		console.log(i1.exports);
		expect(i1.exports.outputs.value).eq(i2.exports.outputs.value);
		const splen = i1.exports.sp_byte_len();
		console.log(i1.exports);
		console.log(i2.exports);
		debugger;
		assert(true);

	});
});