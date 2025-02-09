/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
Copyright (C) 2021 Sber

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

import request from './request.mjs';
import jsonataDriver from '../../global/jsonata/driver.mjs';
import datasetDriver from '../../global/datasets/driver.mjs';
import pathTool from '../../global/manifest/tools/path.mjs';
import entities from '../entities/entities.mjs';
import {isRolesMode, DEFAULT_ROLE} from "../utils/rules.mjs";
import md5 from 'md5';

export default function(app) {

	let currentContext;

	if(isRolesMode()) {
		currentContext = app.storage.roleId === DEFAULT_ROLE ? app.storage.manifests[DEFAULT_ROLE] : app.storage.manifests[app.storage.roleId];
		entities(currentContext);
	} else {
		currentContext = app.storage.manifest;
	}

	const result = Object.assign({}, datasetDriver,
		{
			// Возвращаем метаданных об объекте
			pathResolver(path) {
				return {
					context: currentContext,
					subject: pathTool.get(currentContext, path),
					baseURI: app.storage.md5Map[md5(path)]
				};
			},
			// Драйвер запросов к ресурсам
			request,
			// Драйвер запросов JSONata
			jsonataDriver
		});
	
	return result;
}
