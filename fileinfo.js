const http = require("http");
const fs = require("fs");
const fmap = {};
fs.readdirSync("static").forEach((file) => {
  fmap[file] = fs.readFileSync(file);
});
const info = JSON.stringify(
  Object.keys(fmap).map((filename) => ({
    filename,
    length: fmap[filename].length,
  }))
);
console.log(info, fmap[".eslintrc"].length);

// http
//   .createServer((req, res) => {
//     if (req.url == "/") {
//       res.end(
//         JSON.stringify(
//           Object.keys(fmap).map((filename) => ({
//             filename,
//             length: fmap[filename].buffer.length,
//           }))
//         )
//       );
//     }
//   })
//   .listen(4000);
