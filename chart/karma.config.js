module.exports = function (config) {
  config.set({
    frameworks: ["mocha", "chai"],
    files: [
      {
        pattern: "./chart.js",
        type: "module",
        include: "true",
      },
      {
        pattern: "test/**/*.js",
        type: "module",
      },
    ],
    reporters: ["mocha"],
    mochaReporter: {
      output: "autowatch",
    },
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ["Chrome"],
    autoWatch: true,
    concurrency: Infinity,
  });
};
