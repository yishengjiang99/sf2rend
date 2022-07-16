var static = require("node-static");
var http = require("http");

var file = new static.Server(require("path").resolve(__dirname, ".."));

http
  .createServer(function (req, res) {
    file.serve(req, res);
  })
  .listen(3000);
