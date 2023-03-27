const http = require("http");
const fs = require("fs");
const path = require("path");
const fmap = {};
fs.readdirSync("static").forEach((file) => {
  fmap[file] = fs.readFileSync(require("path").resolve("static", file));
});
const info = JSON.stringify(
  Object.keys(fmap).map((filename) => ({
    filename,
    length: fmap[filename].length,
  }))
);
console.log(info);

http
  .createServer((req, res) => {
    console.log(req.headers);
    if (fmap[path.basename(req.url)]) {
      const buf = fmap[path.basename(req.url)];
      const range = req.headers.range.split("byte=");
      console.log(range);
      const rangeg = req.headers.range
        .split("bytes=")[1]
        .split("-")
        .forEach((a) => parseInt(a));
      res.write(buf.slice(rangeg[0], rangeg[1]));

      res.end(req.headers.range.split("byte=")[1]);
      // return;

      // res.write(buf.slice(range[0], range[1]));
      // res.end();
    } else {
      res.end(info);
    }
  })
  .listen(4000);
