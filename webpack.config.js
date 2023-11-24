const Fs = require("fs");
const procfile = Fs.readFileSync("spin/spin-proc.js").toString("utf-8");
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
Fs.writeFileSync(
  "mfilelist.js",
  `export const mfilelist=${JSON.stringify(
    require("child_process")
      .execSync("ls -rS static/midi/*mid")
      .toString()
      .trim()
      .split("\n")
      .map((f) => encodeURI(f))
  )}`
);
const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    sequence: "./src/sequence/index.js",
    timer: "./src/sequence/timer.js",
    main: "./src/index.js",
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
    static: ".",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
  },
};
