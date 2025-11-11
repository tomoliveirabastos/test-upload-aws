/**
 * Webpack configuration for AWS Lambda function
 */

const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/lambda/metadataExtractor.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lambda.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'aws-sdk': 'aws-sdk', // Don't bundle AWS SDK
  },
  optimization: {
    minimize: true,
  },
};