/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
Copyright (C) 2023 Sber

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

In any derivative products, you must retain the information of
owner of the original code and provide clear attribution to the project

        https://dochub.info

The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Maintainers:
    R.Piontik <R.Piontik@mail.ru>

Contributors:
    R.Piontik <R.Piontik@mail.ru> - 2023
    Nikolay Temnyakov, Sber - 2024
*/

import './helpers/env.mjs';
import logger from './utils/logger.mjs';
import storeManager from './storage/manager.mjs';
import express from 'express';
import middlewareCompression from './middlewares/compression.mjs';
import controllerStatic from './controllers/static.mjs';
import controllerCore from './controllers/core.mjs';
import controllerStorage from './controllers/storage.mjs';
import controllerEntity from './controllers/entity.mjs';
import middlewareAccess from './middlewares/access.mjs';
import middlewareCluster from './middlewares/cluster.mjs';

const LOG_TAG = 'server';

//const express = require('express');
const app = express();
const serverPort = process.env.VUE_APP_DOCHUB_BACKEND_PORT || 3030;

// Актуальный манифест
app.storage = null;

// Подключаем контроль доступа
middlewareAccess(app);

// Основной цикл приложения
const mainLoop = async function() {
    // Загружаем манифест
    const server = app.listen(serverPort, function(){
        logger.log(`DocHub server running on ${serverPort}`, LOG_TAG);
    });

    server.setTimeout(500000);

     storeManager.reloadManifest(app)
         .then(async(storage) => {
             await storeManager.applyManifest(app, storage);
             // Подключаем драйвер кластера
             await middlewareCluster(app, storeManager);

             // Подключаем сжатие контента
             middlewareCompression(app);

             // API ядра
             controllerCore(app);

             // API сущностей
             controllerEntity(app);

             // Контроллер доступа к файлам в хранилище
             controllerStorage(app);

             // Статические ресурсы
             controllerStatic(app);
         });
};

mainLoop();
