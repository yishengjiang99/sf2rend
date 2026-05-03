const fs = require("fs");
const path = require("path");

function listFilesBySize(relativeDir, extension) {
  const absoluteDir = path.resolve(__dirname, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  return fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => {
      const absolutePath = path.join(absoluteDir, entry.name);
      return {
        path: path.posix.join(relativeDir, entry.name),
        size: fs.statSync(absolutePath).size,
      };
    })
    .sort((left, right) => right.size - left.size)
    .map((entry) => entry.path);
}

fs.writeFileSync(
  path.resolve(__dirname, "sflist.js"),
  `export const sf2list=${JSON.stringify(listFilesBySize("static", ".sf2"))}\n`
);

fs.writeFileSync(
  path.resolve(__dirname, "mfilelist.js"),
  `export const mfilelist=${JSON.stringify(
    listFilesBySize("static/midi", ".mid").map((file) => encodeURI(file))
  )}\n`
);

module.exports = {
  mode: "production",
  entry: {
    main: "./src/index.js",
    sequence: "./src/sequence/index.js",
    timer: "./src/sequence/timer.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: (filePath) =>
          /node_modules/.test(filePath) ||
          /fft-64bit[\\/]fft-node\.js$/.test(filePath),
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
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devtool: "inline-source-map",
  devServer: {
    static: ".",
  },
  output: {
    clean: true,
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
};
