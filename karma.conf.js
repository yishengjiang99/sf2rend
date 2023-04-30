// Karma configuration
// Generated on Fri Mar 24 2023 21:30:17 GMT-0700 (Pacific Daylight Time)

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "./",

    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ["mocha", "chai"],

    // list of files / patterns to load in the browser
    files: [
      {
        pattern: "node_modules/mkspin/spin.js",
        type: "module", include: false, served: true
      },
      {
        pattern: "test/**/*.js",
        type: "module",
      },
      {
        pattern: "src/*.js",
        type: "module",
        include: false,
        served: true,
      },
      {
        pattern: "index.html",
        served: "true",
      },
      {
        pattern: "**/*.js",
        included: false,
        served: "true",
      },
      {
        pattern: "**/wasm.js",
        included: false,
        served: "true",
      },
    ],

    // list of files / patterns to exclude
    exclude: ["node_modules", ".git", "~/.vscode*"],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ["progress"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ["Chrome"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: Infinity,
  });
};
