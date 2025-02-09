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
    Vladislav Nefedov, Sber - 2023
    Nikolay Temnyakov, Sber - 2024
    Vladislav Markin, Sber - 2024
*/

import logger from '../utils/logger.mjs';
import manifestParser from '../../global/manifest/parser.mjs';
import cache from './cache.mjs';
import md5 from 'md5';
import events from '../helpers/events.mjs';
import validators from '../helpers/validators.mjs';
import entities from '../entities/entities.mjs';
import objectHash from 'object-hash';
import '../helpers/env.mjs';

import jsonataDriver from '../../global/jsonata/driver.mjs';
import jsonataFunctions from '../../global/jsonata/functions.mjs';
import {newManifest, loader, isRolesMode, DEFAULT_ROLE} from "../utils/rules.mjs";

const LOG_TAG = 'storage-manager';

manifestParser.cache = cache;

manifestParser.onError = (error) => {
	logger.error(`Error of loading manifest ${error}`, LOG_TAG);
};

// eslint-disable-next-line no-unused-vars
manifestParser.onStartReload = (parser) => {
	logger.log('Manifest start reloading', LOG_TAG);
};

// eslint-disable-next-line no-unused-vars
manifestParser.onReloaded = (parser) => {
	logger.log('Manifest is reloaded', LOG_TAG);
};

export default {
	// Кэш для пользовательских функций
	cacheFunction: null,
	// Регистрация пользовательских функций
	resetCustomFunctions(storage) {
		this.cacheFunction = null;

		jsonataDriver.customFunctions = () => {
			if (!this.cacheFunction)
				this.cacheFunction = jsonataFunctions(jsonataDriver, storage.functions || {});
			return this.cacheFunction;
		};

	},
	// Стек обработчиков события на обновление манифеста
	onApplyManifest: [],
	createNewManifest: async function(app) {
		if(app.new_rules) {

			let mergeRules = [];
			const ids = [];

			const {URI} =  global.$roles;
			const url = new URL(URI);
			const defaultUrl = new URL( 'default.yaml', URI);
			const defaultRoles = await loader(defaultUrl);
			const systemRules = defaultRoles?.roles;
			const exclude = defaultRoles?.exclude;

			const manifest = await loader(url);

			for(let rule in app.new_rules) {
				for(let nRule in manifest?.roles) {
					if(app.new_rules[rule] === nRule) {
						mergeRules = mergeRules.concat(manifest?.roles[nRule]);
						ids.push(nRule)
					}
				}
			}

			const id = ids.sort((a,b) => {return a.localeCompare(b);}).join('');

			const filters = systemRules.concat(mergeRules);
			app.storage.manifests[id] = newManifest(app.storage.manifests.origin, exclude, filters);
		}
	},
	reloadManifest: async function(app) {

		logger.log('Run full reload manifest', LOG_TAG);
		// Загрузку начинаем с виртуального манифеста
		cache.errorClear();
		let storageManifest = {};
		let createManifest = async function() {
			await manifestParser.clean();
			await manifestParser.startLoad();
			await manifestParser.import('file:///$root$');
			await manifestParser.checkAwaitedPackages();
			await manifestParser.checkLoaded();
			await manifestParser.stopLoad();
		};

		let createRoleManifest = async function () {
			try {
				// загружаю основной файл с ролями
				const {URI} =  global.$roles;
				const url = new URL(URI);
				const manifest = await loader(url);
				// загружаю правила по умолчанию
				const defaultUrl = new URL('default.yaml', URI);
				const defaultRoles = await loader(defaultUrl);
				const systemRules = defaultRoles?.roles;
				const exclude = defaultRoles?.exclude;

				for (const role in manifest?.roles) {
					const filters = systemRules.concat(manifest?.roles[role]);
					storageManifest.manifests[role] = newManifest(storageManifest.manifests.origin, exclude, filters);
				}
			} catch (e) {
				this.registerError(e, e.uri || uri);
			}
		}

		await createManifest();

		let baseManifest = manifestParser.manifest;

		if(isRolesMode()) {
			storageManifest.manifests = {origin: baseManifest};
			Object.freeze(storageManifest.manifests.origin);
			await createRoleManifest();
			baseManifest = storageManifest.manifests[DEFAULT_ROLE];
		}

		entities(baseManifest);

		logger.log('Full reload is done', LOG_TAG);
		const result = {
			manifest: baseManifest, // Сформированный манифест
			hash: objectHash(baseManifest), // HASH состояния для контроля в кластере
			mergeMap: {},								// Карта склейки объектов
			md5Map: {}, 								// Карта путей к ресурсам по md5 пути
			manifests: {...storageManifest.manifests},
			roleId: DEFAULT_ROLE,
			// Ошибки, которые возникли при загрузке манифестов
			// по умолчанию заполняем ошибками, которые возникли при загрузке
			problems: Object.keys(cache.errors || {}).map((key) => cache.errors[key]) || []
		};

		// Выводим информацию о текущем hash состояния
		logger.log(`Hash of manifest is ${result.hash}`, LOG_TAG);

		// Если есть ошибки загрузки, то дергаем callback 
		result.problems.length && events.onFoundLoadingError();

		for (const path in manifestParser.mergeMap) {
			result.mergeMap[path] = manifestParser.mergeMap[path].map((url) => {
				const hash = md5(path);
				result.md5Map[hash] = url;
				return `backend://${hash}/`;
			});
		}
		return result;
	},
	applyManifest: async function(app, storage) {
		app.storage = storage;  // Инициализируем данные хранилища
		this.resetCustomFunctions(storage.manifest);
		app.storage.roles = [];
		validators(app);        // Выполняет валидаторы
		Object.freeze(app.storage);
		this.onApplyManifest.map((listener) => listener(app));
	},
	cleanStorage(app) {
		this.cacheFunction = null;
		app.storage = undefined;
	}
};

