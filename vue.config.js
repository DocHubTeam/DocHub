const WebpackPwaManifest = require('webpack-pwa-manifest');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('@effortlessmotion/html-webpack-inline-source-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const pluginsConf = require('./plugins.json');
const PluginMaker = require('./src/building/plugin-maker');
const path = require('path');
const package = require('./package.json');

const plugins = [];
const entries = {
	app: './src/frontend/main.js'
};

// Указывается где лежит движок SmartAnts
!process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE && (process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE = '@assets/libs/smartants');


// Определяем версии API плагинов, которые поддерживаются в Enterprise режиме
const ideaAPIAvailable = process.env.VUE_APP_DOCHUB_IDE_IDEA_API || package.ide?.idea?.api || [];
process.env.VUE_APP_DOCHUB_IDE_IDEA_API = Array.isArray(ideaAPIAvailable) ? ideaAPIAvailable : ideaAPIAvailable.toString().split(',');

const vscodeAPIAvailable = process.env.VUE_APP_DOCHUB_IDE_VSCODE_API || package.ide?.vscode?.api || [];
process.env.VUE_APP_DOCHUB_IDE_IDEA_API = Array.isArray(vscodeAPIAvailable) ? vscodeAPIAvailable : vscodeAPIAvailable.toString().split(',');

// Собираем встраиваемые плагины
//if (process.env.VUE_APP_DOCHUB_MODE === 'production') {
(pluginsConf?.inbuilt || []).map((item) => {
	const config = require(`./${item}/package.json`);
	entries[`plugins/${item}`] = `./${item}/${config.main || 'index.js'}`;
});
//}

// Добавляем в манифест внешние плагины
const manifest = {
	name: 'DocHub',
	short_name: 'DocHub',
	description: 'Architecture as a code',
	background_color: '#ffffff',
	crossorigin: 'use-credentials',
	plugins: pluginsConf?.external,
	filename: 'manifest.json'
};

plugins.push(new WebpackPwaManifest(manifest));

// Добавляем собственный плагин-мейкер
plugins.push(new PluginMaker());

if (process.env.VUE_APP_DOCHUB_MODE === 'plugin') {
	plugins.push(new HtmlWebpackPlugin({
		filename: 'plugin.html',
		template: 'src/ide/plugin.html',
		inlineSource: '.(woff(2)?|ttf|eot|svg|js|css|map)$',
		inject: true
		/* ,
		minify: {
			removeComments: true,
			collapseWhitespace: true,
			removeAttributeQuotes: true,
			minifyCSS: true,
			minifyJS: true
			// more options:
			// https://github.com/kangax/html-minifier#options-quick-reference
		} */
	}));
	plugins.push(new HtmlWebpackInlineSourcePlugin());
} else {
	// plugins.push(new BundleAnalyzerPlugin());
}

// Дефолтная конфигурация dev-сервера
let config = {
	runtimeCompiler: true,
	devServer: {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
		},
		/*
		allowedHosts: [
			'localhost'
		],
		*/
		client: { overlay: false },
		hot: process.env.VUE_APP_DOCHUB_HOTRELOAD === 'off' ? false : true
	},
	transpileDependencies: [
		'vuetify',
		/[\\/]plugins[\\/].*\.js$/ 
	],
	chainWebpack: (config) => {
		config.module.rules.delete('svg');

		// ВОТ ЭТОТ БЛОК НУЖЕН:
        config.optimization.minimizer('terser').tap((args) => {
            args[0].exclude = /[\\/]plugins[\\/]/; // Исключаем папку с плагинами
            args[0].terserOptions = {
                ...args[0].terserOptions,
                module: true // Разрешаем ESM
            };
            return args;
        });		
	},
	configureWebpack: {
		cache: (process.env.VUE_APP_DOCHUB_BUILDING_CACHE || 'memory').toLowerCase() === 'filesystem'
			? {
				type: 'filesystem',
				compression: 'gzip',
				allowCollectingMemory: true
			}
			: {
				type: 'memory'
			},
		experiments: {
			outputModule: true
		},
		optimization: {
			splitChunks: false,
			runtimeChunk: 'single'
		},
		entry: { ...entries },
		plugins,
		module: {
			rules: [
				{
					test: /\.js$/,
					include: [path.resolve(__dirname, 'plugins')],
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								['@babel/preset-env', { modules: false }] // Правильный синтаксис здесь
							]
						}
					}
				},
				{
					test: /\.svg$/,
					loader: 'vue-svg-loader'
				},
				{
					test: /\.mjs$/,
					include: /node_modules/,
					type: 'javascript/auto'
				},
				{
					test: /\.([cm]?ts|tsx)$/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								compilerOptions: {
									noEmit: false
								}
							}
						}
					]
				}
			]
		},
		output: {
			filename: '[name].js'
		},
		resolve: {
			alias: {
				'@front': path.resolve(__dirname, './src/frontend'),
				'@assets': path.resolve(__dirname, './src/assets'),
				'@back': path.resolve(__dirname, './src/backend'),
				'@idea': path.resolve(__dirname, './src/ide/idea'),
				'@vscode': path.resolve(__dirname, './src/ide/vscode'),
				'@ide': path.resolve(__dirname, './src/ide'),
				'@global': path.resolve(__dirname, './src/global'),
				'@': path.resolve(__dirname, './')
			},
			extensions: ['.ts', '.js']
		}
	}
};

// Подключает сертификаты, если они обнаружены
/*
if(fs.lstatSync(__dirname + '/certs').isDirectory()) {
	config.devServer = {
		http2: true,
		https: {
			key: fs.readFileSync(__dirname + '/certs/server.key'),
			cert: fs.readFileSync(__dirname + '/certs/server.cert')
		}
	}
}
*/
module.exports = config;
