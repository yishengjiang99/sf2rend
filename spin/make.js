var binaryen = require("binaryen");
const es = require("child_process").execSync;
es(
  `node_modules/webassembly/tools/bin/darwin-x64/clang spin.c -c --target=wasm32-unknown-unknown -emit-llvm -nostdinc -nostdlib -o build/spin.o`
);
es(
  `node_modules/webassembly/tools/bin/darwin-x64/llc build/spin.o -march=wasm32 -filetype=asm -o build/spin.wasm`
);

// const bin = require("fs").readFileSync("build/spin.wasm");
// var myModule = binaryen.readBinary(new Uint8Array(bin));
// console.log(myModule.memory);
// myModule.setMemory(122, 122, "memoary", [], true);

// require("fs").writeFileSync("spin.atomic.wasm", myModule.emitBinary());
