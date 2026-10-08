const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Build id for cache-busting the unbundled worklet URLs. Same source as
// the Makefile's BUILD_ID (git rev-parse --short HEAD) so `make site`
// and the bundle agree; BUILD_ID env wins when set.
function buildId() {
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}
const BUILD_ID = buildId();

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
    .sort(
      (left, right) =>
        right.size - left.size || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
    )
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

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";
  return {
    mode: isProd ? "production" : "development",
    entry: {
      main: "./src/index.js",
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
    // No inline source maps in production output; keep them for development.
    devtool: isProd ? false : "inline-source-map",
    devServer: {
      static: ".",
    },
    output: {
      clean: true,
      filename: "[name].[contenthash].js",
      chunkFilename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      // "auto" resolves asset URLs relative to the page, so the site works
      // both at / and under the /sf2rend/ project-pages base path.
      publicPath: "auto",
    },
    plugins: [
      // Injects the content-hashed main bundle into index.html, replacing
      // the hand-maintained ?v= query string.
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
        inject: "body",
        scriptLoading: "defer",
      }),
      // Build id for the unbundled worklet addModule() URLs.
      new webpack.DefinePlugin({
        __BUILD_ID__: JSON.stringify(BUILD_ID),
      }),
    ],
  };
};
