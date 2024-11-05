/*
Copyright (C) 2023 Sber
Copyright (C) 2024 Roman Piontik R.Piontik@mail.ru

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Maintainers:
    Navasardyan Suren, Sber

Contributors:
    Navasardyan Suren, Sber - 2023
    R.Piontik <r.piontik@mail.ru> - 2023
    Vladislav Nefedov, Sber - 2023
    R.Piontik <r.piontik@mail.ru> - 2024
*/

const WebpackPwaManifest = require('webpack-pwa-manifest');
const { execSync } = require('child_process');
const { defineConfig } = require('@vue/cli-service');
const path = require('path');
const pluginsConf = require('./plugins.json');
const PluginMaker = require('./src/building/plugin-maker');

const CONFIG_PATH = 'vue.lib.js';
const ENTRY_PATH = './src/frontend/bootstrap.js';
const EXEC_COMMAND = [
  `VUE_CLI_SERVICE_CONFIG_PATH=$PWD/${CONFIG_PATH}`,
  'vue-cli-service build',
  `--target lib ${ENTRY_PATH}`
];

const plugins = [];
const entries = {};

!process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE && (process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE = '@assets/libs/smartants');

(pluginsConf?.inbuilt || []).map((item) => {
  const config = require(`./${item}/package.json`);
  entries[`plugins/${item}`] = `./${item}/${config.main || 'index.js'}`;
});

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

plugins.push(new PluginMaker());

const config = defineConfig({
  transpileDependencies: ['vueitfy'],
  productionSourceMap: false,
  publicPath: './',
  css: {
    sourceMap: false
  },
  configureWebpack: {
    entry: entries,
    plugins,
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        },
        {
          test: /\.tsx?$/,
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
        },
        {
          test: /\.(ttf|otf|eot|woff|woff2)$/,
          type: 'asset/resource',
          generator: {
            filename: './fonts/[name][ext]'
          }
        }
      ]
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
});

(() => {
 if(process.argv.length < 3) {
   execSync(`${EXEC_COMMAND}`.replace(/,/g, ' '), {
     stdio: 'inherit',
     encoding: 'utf8'
   });
   execSync('chmod -R 777 ./dist');
   execSync('mv ./dist/dochubcore.umd.min.js ./dist/dochub.js');
   execSync('rm -rf ./dist/*umd* ./dist/*common* ./dist/*html*');
   execSync('mkdir ./dist/backend');
   execSync('cp -r ./src/backend ./dist/backend/src');
   execSync('cp -r ./src/global ./dist/backend/global');
   execSync('cp -r ./src/assets ./dist/backend/assets');
 }
})();

module.exports = config;
