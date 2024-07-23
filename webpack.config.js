const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/frontend/static/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'src/frontend/static/dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  }
};
