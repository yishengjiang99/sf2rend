const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    main: "./src/index.js",
    midiworker: "./src/midiworker.js",
  },
  mode: "production",

  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "[name].js",
  },
};
