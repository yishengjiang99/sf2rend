const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    main: "./src/index.js",
    midiworker: "./src/midiworker.js",
    fetchworker: "./fetch-drop-ship/worker.js",
  },
  mode: "development",

  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "[name].js",
  },
};
