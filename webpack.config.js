const Fs = require("fs");
Fs.writeFileSync(
  "./api/v1_list.js",
  `export const sf2list=${JSON.stringify(
    require("child_process")
      .execSync("ls -rS static")
      .toString()
      .trim()
      .split("\n")
  )}`
);
const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/index.js",
    midiworker: "./src/midiworker.js",
  },
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
  },
};
