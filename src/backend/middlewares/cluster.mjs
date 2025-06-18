/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
Copyright (C) 2024 Sber

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

// Обеспечивает работу DocHub в кластере
import createRedisClient from '../drivers/redis.mjs';
import logger from '../utils/logger.mjs';

const LOG_TAG = 'cluster-middleware';

const CLUSTER_HASH_KEY = 'DocHub.cluster.hash';

export default async(app, storeManager) => {
    if ((process.env.VUE_APP_DOCHUB_CLUSTER || 'off').toLowerCase() === 'on') {
        const client = await createRedisClient();
        if (!client) {
            const message = 'I can not create a cluster because connecting to Redis is impossible';
            logger.error(message, LOG_TAG);
            throw new Error(message);
        }

        // Устанавливаем в кластере HASH своей загрузки
        client.set(CLUSTER_HASH_KEY, app.storage.hash);
        logger.log(`Hash of cluster updated to [${app.storage?.hash}]`, LOG_TAG);

        // Устанавливаем обработчик события изменения манифеста
        storeManager.onApplyManifest.push(async() => {
            await client.set(CLUSTER_HASH_KEY, app.storage.hash);
        });

        const clusterMiddleware = async function(req, res, next) {
            // Если идет перезагрузка, отдаем 503
            const remoteHash = await client.get(CLUSTER_HASH_KEY) || app.storage?.hash;
            if (remoteHash !== app.storage?.hash) {
                logger.log(`Cluster inconsistency detected. Current hash is [${app.storage?.hash}], remote hash is [${remoteHash}]. Reloading manifest...`, LOG_TAG);
                storeManager.cleanStorage(app);
                storeManager.reloadManifest(app)
                .then(async(storage) => {
                    await storeManager.applyManifest(app, storage);
                    logger.log(`Reloading complete. Current hash is [${app.storage.hash}], remote hash is [${remoteHash}].`, LOG_TAG);
                })
                .catch((err) => {
                    logger.error(err, LOG_TAG);
                });
            }
            next();
        };

        app.use(clusterMiddleware);
    }
};
