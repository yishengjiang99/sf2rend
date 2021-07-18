const { execSync } = require("child_process");
const { readFileSync, writeFile, existsSync } = require("fs");

var compile_all = `emcc read.c \
    -s ASSERTIONS=1 \
    -s INITIAL_MEMORY=64mb              \
    -s USE_ES6_IMPORT_META=0 \
    -s MODULARIZE=1 \
    -s EXIT_RUNTIME=0 \
   -fsanitize=address \
    -s EXPORT_ES6=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' \
    -o read.js`;
console.log(compile_all);
process.stderr.write(execSync(compile_all).toString());
