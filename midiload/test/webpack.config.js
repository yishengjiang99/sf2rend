module.exports = {
  //...
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: [
          {
            loader: require("path").resolve("../src/loader.js"),
          },
        ],
      },
    ],
  },
};
