const path = require('path');

module.exports = {
  entry: './src/handlers/hello.js',
  target: 'node',
  mode: 'production',
  externals: {
    'aws-sdk': 'aws-sdk'
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
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: 'hello.js'
  }
};
