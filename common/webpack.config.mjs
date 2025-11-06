import path from 'path';
import {defineConfig} from "webpack-define-config";
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import * as fs from "node:fs";
import {CleanWebpackPlugin} from "clean-webpack-plugin";

export function webpackConfigPreset(root=false) {
    let projectName = path.resolve('./').split(path.sep).pop();
    let packageJson = JSON.parse(fs.readFileSync(path.resolve(`./package.json`), {encoding: "utf-8"}));
    return defineConfig({
        mode: "production",
        target: "web",

        entry: "./src/index",

        output: {
            path: path.resolve(root ? `../dist/` : `../../dist/${projectName}/`),
            filename: `[name]-[contenthash].js`,
            assetModuleFilename: '[hash][ext][query]',
            publicPath: root ? `/` : `/${projectName}/`,
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx|tsx|ts)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-typescript',
                            ['@babel/preset-react', {"runtime": "automatic"}]
                        ]
                    }
                },
                {
                    test: /\.svg$/i,
                    use: ['svg-sprite-loader',
                        'svgo-loader']
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.png$/i,
                    type: 'asset/resource'
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(glsl|vsh|fsh)$/i,
                    type: 'asset/source'
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        "style-loader",
                        // Translates CSS into CommonJS
                        "css-loader",
                        // Compiles Sass to CSS
                        "sass-loader",
                    ],
                }
            ]
        },

        resolve: {
            extensions: [
                '.tsx',
                '.ts',
                '.js'
            ]
        },

        plugins: root ? [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "../common/index.html",
                publicPath: `./`,
                templateParameters: {
                    title: "Fun Projects",
                },
                filename: "./index.html",
                //favicon: "../../common/favicon.ico"
            }),
        ] : [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "../../common/index.html",
                templateParameters: {
                    title: packageJson.displayName,
                },
                publicPath: `./`,
                filename: "./index.html",
                //favicon: "../../common/favicon.ico"
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "./thumbnail.png",
                        to: "./thumbnail.png"
                    }
                ]
            })
        ]
    });
}