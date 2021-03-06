const path = require("path");
const webpack = require("webpack");
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
module.exports = {
  entry: {
    main: "./src/index.js",
    midiworker: "./src/midiworker.js",
  },
  mode: "production",

  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    publicPath: "dist/",

    path: path.resolve(__dirname, "dist/"),
    filename: "[name].js",
  },
};
