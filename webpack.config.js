module.exports = {
  entry: './src/index.js',
  outputFileName: './js/bundle.[hash].js',

  // configuration for the eslint loader is located in an extra file
  eslint: {
    showWarnings: true,
    engine: {
      configFile: './.eslintrc'
    }
  },
  target: 'node',

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
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015', 'stage-1']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devServer: {
    historyApiFallback: true,
    contentBase: './'
  }
};
