const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/index.js",
    midiworker: "./src/midiworker.js",
  },
  mode: "development",

  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "[name].js",
  },

  plugins: [new CleanWebpackPlugin(), new webpack.HotModuleReplacementPlugin()],
};
