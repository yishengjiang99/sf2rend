// Karma configuration
// Generated on Fri Mar 24 2023 20:28:48 GMT-0700 (Pacific Daylight Time)

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "./",

    coverageReporter: {
      type: 'html',
      dir: 'coverage/'
    },
    // frameworks to use
    frameworks: ['mocha', 'chai'],
    // list of files / patterns to load in the browser
    files: [
      {pattern: "*.js", type: "module"},
      {
        pattern: "./test/*.spec.js",
        type: "module",
      }],




    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
      '*.js': ['coverage']
    },

    //reporters: ['progress', 'coverage'],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: {
      client: {
        mocha: {
          // change Karma's debug.html to the mocha web reporter
          reporter: 'html',

          // require specific files after Mocha is initialized

          // custom ui, defined in required file above
        }
      }
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: Infinity
  })
}
