const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        app: path.resolve(__dirname, 'src/index.tsx'),
    },
    context: __dirname,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../dist/public')
    },
    // Enable sourcemaps for debugging
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
            { test: /\.css$/, use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                        namedExport: true,
                        camelCase: true,
                        sourceMap: true,
                        localIdentName: '[name]__[local]--[hash:base64:5]'
                    }
                },
            ] },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        })
    ],
    // Avoid bundling React
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
    }
}