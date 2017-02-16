// Karma configuration
module.exports = function(config) {
	var webpackConfig = require('./webpack.config.js');

	config.set({
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: [ 'Firefox' ],
		port: 9876,
		concurrency: Infinity,
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,
		// whether to execute tests whenever any file changes
		autoWatch: false,

		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'jasmine' ],

		// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
		logLevel: config.LOG_INFO,
		reporters: [ 'spec' ],
		colors: true,

		specReporter: {
			suppressErrorSummary: true,
			suppressFailed: false,
			suppressPassed: false,
			suppressSkipped: true,
			showSpecTiming: false
		},

		files: [
			'test/test-context.js'
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'test/test-context.js': [ 'webpack', 'sourcemap', 'eslint' ]
		},

		webpack: webpackConfig,
		webpackMiddleware: {
			// do not log info about bundling
			noInfo: true
		}
	});

	config.webpack.devtool = 'inline-source-map';
};
