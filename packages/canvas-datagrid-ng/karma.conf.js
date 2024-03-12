//@ts-check
/** @typedef {import('karma').Config} KaramConfigSetter */
/** @typedef {import('karma').ConfigOptions} KaramConfig */
/**
 * @see https://karma-runner.github.io/6.4/config/configuration-file.html
 * @param {KaramConfigSetter} config
 */
module.exports = function (config) {
  /** @type {KaramConfig} */
  const baseOptions = {
    browserNoActivityTimeout: 180000,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'karma-typescript'],

    // list of files / patterns to load in the browser
    files: [
      {
        pattern: 'test/**/*.js',
        type: 'module',
        included: true,
        served: true,
      },
      {
        pattern: 'test/**/*.ts',
        type: 'module',
        included: true,
        served: true,
      },
      {
        pattern: 'lib/**/util.js',
        type: 'module',
        included: true,
        served: true,
      },
      {
        pattern: 'dist/**/util.js',
        type: 'module',
        included: true,
        served: true,
      },
      {
        pattern: 'dist/canvas-datagrid.debug.js',
        included: true,
        served: true,
      },
    ],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/lib/*.js': ['coverage'],
      '**/*.ts': ['karma-typescript'],
    },

    failOnFailingTestSuite: true,

    customContextFile: 'test/index.html',

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'karma-typescript', 'coverage', 'html'],

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
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'], // Switch to 'Chrome' to see the renders in actual browser

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true, // Switch to false for interactively watching tests

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  };

  Object.assign(baseOptions, {
    coverageReporter: {
      type: 'json',
      dir: './build',
      file: 'coverage.json',
    },
    htmlReporter: {
      outputDir: 'build/karma_html',
    },
    karmaTypescriptConfig: {
      compilerOptions: {
        module: 'ES6',
        sourceMap: true,
        skipLibCheck: true,
        target: 'ES6',
      },
      include: ['test'],
      exclude: ['node_modules'],
    },
  });

  config.set(baseOptions);
};
