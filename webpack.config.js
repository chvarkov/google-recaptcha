const path = require('path');
const NodeExternals = require('webpack-node-externals');
const DtsBundleWebpack = require('dts-bundle-webpack');

module.exports = () => {
    return {
        entry: ['./src/index.ts'],
        target: 'node',
        externals: [
            NodeExternals({
                whitelist: ['./src/index.ts'],
            }),
        ],
        node: {
            __dirname: false,
            __filename: false,
        },
        module: {
            rules: [
                {
                    test: /.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        mode: 'development',
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        plugins: [
            new DtsBundleWebpack({
                name: 'package-name',
                main: 'dist/index.d.ts',
                baseDir: 'dist',
                out: 'index.d.ts',
                externals: false,
                removeSource: true,
                outputAsModuleFolder: true,
                headerText: ` Package ${require('./package').name} `
            })
        ],
        watchOptions: {
            ignored: '**/*.log',
        },
        output: {
            path: path.join(__dirname, 'dist'),
            filename: 'index.js',
        },
    };
};
