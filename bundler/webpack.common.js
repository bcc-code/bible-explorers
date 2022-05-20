const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')

const path = require('path')

module.exports = {
    entry: path.resolve(__dirname, '../src/script.js'),
    output:
    {
        filename: 'script.js',
        path: path.resolve(__dirname, '../dist')
    },
    devtool: 'source-map',
    plugins:
        [
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, '../static') }
                ]
            }),

            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, '../src/index.html'),
                minify: true
            }),

            new MiniCSSExtractPlugin({
                filename: "style.css"
            }),

            new WorkboxPlugin.InjectManifest({
                swSrc: "./src/js/sw/sw.js",
                swDest: "./sw.js",
                maximumFileSizeToCacheInBytes: 20000000,
                exclude: [/\.gitkeep$/, /\.map$/, /\.txt$/, /\index.html$/,  /\style.css/,  /\script.js/]
            })
        ],
    module:
    {
        rules:
            [
                // HTML
                {
                    test: /\.(html)$/,
                    use:
                        [
                            'html-loader'
                        ]
                },

                // JS
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use:
                        [
                            'babel-loader'
                        ]
                },

                //  SCSS
                {
                    test: /\.scss$/,
                    use: [
                        MiniCSSExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },

                // CSS
                {
                    test: /\.css$/,
                    use: [
                        "style-loader",
                        {
                          loader: "css-loader",
                          options: {
                            importLoaders: 1,
                            modules: true,
                          },
                        },
                    ],
                },

                // SVG
                {
                    test: /\.svg$/,
                    type: 'asset/inline',
                   
                },

                // Images
                {
                    test: /\.(jpg|png|gif|svg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/images/[hash][ext]'
                    },
                },

                // Fonts
                {
                    test: /\.(ttf|eot|woff|woff2)$/,
                    type: 'asset/resource',
                    generator:
                    {
                        filename: 'assets/fonts/[hash][ext]'
                    }
                },

                // Shaders
                {
                    test: /\.(glsl|vs|fs|vert|frag)$/,
                    type: 'asset/resource',
                    generator:
                    {
                        filename: 'assets/images/[hash][ext]'
                    }
                }
            ]
    }
}
