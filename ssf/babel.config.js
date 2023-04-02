module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: 80,
        },
      },
    ],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    [
      "import",
      {
        libraryName: "antd",
      },
    ],
  ],
};
