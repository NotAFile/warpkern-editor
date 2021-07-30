const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ]
    },
    resolve: {
        alias: {
            "vue$": "vue/dist/vue.esm.js"
        },
        extensions: ["*", ".js", ".vue", ".json"]
    },
    devServer: {
        proxy: {
            "/api": "http://localhost:8000"
        },
        port: 3100,
    },
    plugins: [
        new BrowserSyncPlugin(
            {
                host: "localhost",
                port: 3000,
                proxy: "http://localhost:3100",
            },
            {
                // reload: false,
            }
        )
    ]
};
