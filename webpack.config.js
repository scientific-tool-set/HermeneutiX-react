var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index.js',
	outputFileName: './js/bundle.js',

	// configuration for the eslint loader is located in an extra file
	eslint: {
		showWarnings: true,
		engine: {
			configFile: './.eslintrc'
		}
	},
	target: 'node',
	devtool: 'source-map',

	module: {
		preLoaders: [
			{
				test: /\.jsx?$/,
				loader: 'eslint-loader',
				exclude: /(node_modules|containers|components)/
			},
			{
				test: /\.jsx?$/,
				loader: 'source-map-loader'
			}
		],
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.(jpg|jpeg|gif|png)$/,
				loader: 'file?emitFile=false&name=../img/[name].[ext]',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: [ '', '.js', '.jsx' ]
	},
	devServer: {
		historyApiFallback: true,
		contentBase: './'
	},
	plugins: [
		new CopyWebpackPlugin([
			{
				from: 'src/assets/img/**.*',
				to: 'img/[name].[ext]'
			}
		]),
		// inject (hashed) bundle.js into index.html
		new HtmlWebpackPlugin({
			template: './index.html',
			hash: true,
			inject: true
		}),
        // Search for equal or similar files and deduplicate them in the output.
        new webpack.optimize.DedupePlugin(),
        // Assign the module and chunk ids by occurrence count (ids that are used often get lower/shorter ids)
		new webpack.optimize.OccurenceOrderPlugin(),
		// babel-preset-react-app expects the 'process.env.NODE_ENV' to be set
        new webpack.DefinePlugin({
            'process.env': {
				'NODE_ENV': '"dev"'
			}
		})
	]
};
