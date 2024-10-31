// config-overrides.js
const { override, addBabelPlugin, addWebpackModuleRule } = require('customize-cra');

module.exports = override(
    addBabelPlugin('@babel/plugin-proposal-optional-chaining'),
    addWebpackModuleRule({
        test: /\.js$/,
        include: /node_modules\/@stomp\/stompjs/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env'],
            },
        },
    })
);
