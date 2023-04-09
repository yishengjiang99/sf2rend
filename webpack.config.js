const Fs = require("fs");
Fs.writeFileSync(
  "sflist.js",
  `export const sf2list=${JSON.stringify(
    require("child_process")
      .execSync("ls -rS static/*sf2")
      .toString()
      .trim()
      .split("\n")
  )}`
);

const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    sequence: "./src/sequence/index.js",
    timer: "./src/sequence/timer.js",
  },
  module: {
    rules: [
      {
        test: /\.?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
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
