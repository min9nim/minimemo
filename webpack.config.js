const path = require('path');
const webpack = require('/usr/local/lib/node_modules/webpack');

module.exports = {
    entry: {
        bundle: './src/app.js',
    },
    output: {
        path: path.resolve(__dirname, '.'),
        filename: '[name].js'
    },
    module: {
        /*
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                include: path.join(__dirname, '.'),
                loaders: 'babel-loader', //babel에서 수정 (더이상 -loader를 생략할 수 없음)
                query: {
                    presets: ['es2015']
                }
            }
        ],
        */
        rules: [{
                    test: /\.js$/,
                    exclude: /node_modules/,
                    include: path.join(__dirname, '.'),
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    }
                },
                {
                    test: /\.(s*)css$/,
                    use: ['style-loader', 'css-loader', 'sass-loader']
                }
        ]
    },
    watch: true
    /*
    , plugins: [
        new webpack.optimize.UglifyJsPlugin({     // es6이상은 지원하지 못함
            sourceMap: true,
            compress: {
                warnings: true,
            },
        })
    ]
    */

};
