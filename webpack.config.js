const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './out/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [
    ],
  },
  target: 'web',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {from: '*.css', context: 'src/'},
        {from: 'src/index.html'},
        {from: 'src/assets/gfx', to: 'assets/gfx/'},
        {from: '**/*.json', context: 'src/assets/maps', to: 'assets/maps'}
      ],
    }),
  ],
};
