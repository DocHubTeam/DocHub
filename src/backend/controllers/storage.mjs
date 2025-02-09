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
    Vladislav Markin, Sber - 2023
    Nikolay Temnyakov, Sber - 2024
*/
import logger from '../utils/logger.mjs';
import request from '../helpers/request.mjs';
import {getRoles} from '../helpers/jwt.mjs';
import {getCurrentRuleId, getCurrentRules} from "../utils/rules.mjs";

const LOG_TAG = 'controller-storage';

export default (app) => {
    // Проксирует запрос к хранилищу
    app.get('/core/storage/:hash/*', async function(req, res) {

        const roles = getRoles(req.headers);
        const currentRules = await getCurrentRules(roles);
        const id = await getCurrentRuleId(roles);
        app.storage = {...app.storage, roles: [...currentRules], roleId: id};

        const hash = req.params.hash || '$unknown$';
        const url = req.originalUrl.slice(`/core/storage/${hash}/`.length).replace(/\%E2\%86\%90/g, '..');
        //const url = decodeURIComponent(req.params.url);
        const uri = url.split('?')[0];
        const baseURL = app.storage?.md5Map[hash];
        logger.log(`Request to storage ${req.originalUrl}`, LOG_TAG);
        if (!baseURL || !uri) {
            res.status(403).json({
                error: 'Access denied'
            });
        } else {
            request(uri, baseURL, res)
                .catch((e) => res.status(500).json({
                    message: e.message,
                    error: e
                }));
        }
    });
};
