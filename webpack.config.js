const path = require('path');

module.exports = {
  entry: {
    app: path.join(__dirname, '/static/main')
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: path.join(__dirname, 'static'),
    filename: 'bundle.dist.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel'],
        include: path.join(__dirname, '/static')
      }

    ]
  }
};
