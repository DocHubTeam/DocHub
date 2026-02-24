  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

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
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru>
      Nikolay Temnyakov <temnjakovn@gmail.com>
      clayzenx <clay.zenx@gmail.com>
  */

import * as semver from 'semver';
import cache from './services/cache.mjs';
import prototype from './prototype.mjs';
import yaml from 'yaml';

class PackageError extends Error {
	constructor(uri, message) {
		super(message);
		this.name = 'Package';
		this.uri = uri;
	}
}

// Определяет глубину лога источника для секции
const sectionDeepLog = {
	'forms': 0,
	'namespaces': 0,
	'imports': 0,
	'aspects': 2,
	'docs': 3,
	'contexts': 2,
	'components': 2,
	'entities': 6,
	'rules': 3,
	'datasets': 2,
	'$default$': 2
};

// Получает глубину секции из конфигурации или использует значение по умолчанию
function getSectionDeepLog(section, manifest) {
	// Сначала проверяем статические значения из sectionDeepLog
	if (sectionDeepLog[section] !== undefined) {
		return sectionDeepLog[section];
	}
	
	// Проверяем, есть ли конфигурация merge_depth в метамодели сущности
	// Это позволяет задавать глубину для пользовательских сущностей через config.merge_depth
	if (manifest?.entities?.[section]?.config?.merge_depth !== undefined) {
		return manifest.entities[section].config.merge_depth;
	}
	
	// Возвращаем значение по умолчанию
	return sectionDeepLog['$default$'];
}

const parser = {
	// Манифест перезагружен
	onReloaded: null,
	// Запущена перезагрузка манифеста
	onStartReload: null,
	// События по ошибкам (ошибки запросов)
	onError: null,
	// Если обработчик определен, он вызывается при запросе ресурса
	// По умолчанию используется request модуль
	onPullSource: null,
	// Сервис управления кэшем
	cache,
	// Очистка
	clean() {
		this.loaded = {};
		this.mergeMap = {};
		this.manifest = {};
	},
	startLoad() {
	    this.loaded = {};
		this.onStartReload && this.onStartReload(this);
	},
	stopLoad() {
		this.expandPrototype();
		this.onReloaded && this.onReloaded(this);
		this.loaded = {};
	},
	// Журнал объединений
	mergeMap: {},
	// Итоговый манифест
	manifest: {},
	// Лог загруженных файлов
	loaded: {},
	// Загруженные пакеты
	packages: {},
	// Ожидающие пакеты
	awaitedPackages: {},
	// Реализует наследование
	expandPrototype() {
		prototype.expandAll(this.manifest);
	},
	// Преобразование относительных ссылок в прямые
	propResolver: {},
	//Регистрирует ошибку
	// e - объект ошибки
	// uri - источник ошибки
	registerError(e, uri) {
		const errorPath = `$errors/requests/${new Date().getTime()}`;
		// eslint-disable-next-line no-console
		console.error(e, `Ошибка запроса [${errorPath}:${uri}]`, e);
		this.pushToMergeMap(errorPath, null, uri);
		if (typeof e === 'string') e = JSON.parse(e);
		let errorType = (() => {
			switch (e.name) {
				case 'YAMLSyntaxError':
				case 'YAMLSemanticError':
					return 'syntax';
				case 'EntryIsADirectory (FileSystemError)':
					return 'file-system';
				case 'Package':
					return 'package';
				default:
					return 'net';
			}
		})();

		this.onError && this.onError(errorType, {
			uri,
			error: e
		});
	},
	// Сохраняет в карте склеивания данные
	pushToMergeMap(path, source, location) {
		const structPath = (path || '/').split('/');
		const section = structPath[1] || '$default$';
		// Используем функцию getSectionDeepLog для получения глубины секции
		// Это позволяет учитывать как статические настройки, так и динамические из config.merge_depth
		const depth = getSectionDeepLog(section, this.manifest);
		const storePath = structPath.slice(0, depth + 1).join('/');

		let locations = this.mergeMap[storePath];

		!locations && (this.mergeMap[storePath] = locations = []);
		locations.indexOf(location) < 0 && locations.push(location);

		if (typeof source === 'object') {
			for (const key in source) {
				this.pushToMergeMap(`${path || ''}/${key}`, source[key], location);
			}
		}
	},
	// Склеивание манифестов
	// destination - Объект с которым происходит объединение. Низкий приоритете.
	// source - Объект с которым происходит объединение. Высокий приоритете.
	// location - Размещение объекта source (источник изменений)
	// path - Путь к объекту
	merge(destination, source, location, path) {
		let result;
		if (destination === undefined) {
			result = source;
			this.pushToMergeMap(path, result, location);
		} else if (Array.isArray(source)) {
			if (Array.isArray(destination)) {
				const temp = [];
				result = [];
				destination.map((distItem) => {
					const distContent = JSON.stringify(distItem);
					if (!source.find((srcItem, index) => {
						!temp[index] && (temp[index] = JSON.stringify(srcItem));
						return distContent === temp[index];
					})) {
						result.push(distItem);
					}
				});
				result = source.concat(result);
			} else {
				result = source;
			}
			this.pushToMergeMap(path, result, location);
		} else if (typeof source === 'object') {
			result = destination;
			typeof result !== 'object' && (result = {});
			const pathStruct = path ? path.split('/') : [];
			const entity = pathStruct.pop();
			for (const id in source) {
				const keyPath = `${path || ''}/${id}`;
				if (result[id]) {
					result[id] = this.merge(result[id], source[id], location, `${path || ''}/${id}`);
				} else {
					result[id] = source[id];
					this.pushToMergeMap(keyPath, result[id], location);
				}
				pathStruct.length === 1 && this.propResolver[entity] && this.propResolver[entity](result[id], location);
			}
		} else {
			result = source;
			this.pushToMergeMap(path, result, location);
		}
		return result;
	},

	// Возвращает контекст свойства по заданному пути
	// path - пусть к свойству
	getManifestContext(path) {
		let node = this.manifest;
		const keys = path.split('/');
		for (let i = 0; i < keys.length - 1; i++) {
			const key = decodeURIComponent(keys[i]);
			node = node[key] || (node[key] = {});
		}
		const property = decodeURIComponent(keys.pop());
		return {
			node,
			property,
			data: node[property]
		};
	},

	// Декомпозирует свойство манифеста
	// Если свойство содержит ссылку, загружает объект
	// data - Значение свойства
	// path - путь к свойству от корня манифеста
	async expandProperty(data, path, baseURI) {
		// const data = this.getManifestContext(path).data;
		// Если значение является ссылкой, загружает объект по ссылке
		if (typeof data === 'string') {
			const URI = parser.cache.makeURIByBaseURI(data, baseURI);

			try {
				const response = this.onPullSource 
					? await this.onPullSource(URI, path, this)
					: await parser.cache.request(URI, path);
				if (response) {
					const context = this.getManifestContext(path);
					context.node[context.property] = this.merge(context.node[context.property], response.data, URI, path);
				}
			} catch (e) {
				this.registerError(e, URI);
			}
		}
	},
	// Разбираем сущности
	// path - путь к перечислению сущностей (ключ -> объект)
	async parseEntity(context, path, baseURI) {
			for (const key in context) {
				await this.expandProperty(context[key], `${path}/${encodeURIComponent(key)}`, baseURI);
			}
	},

	async parseImports(manifest, baseURI) {
		for (const key in manifest?.imports || []) {
			const url = parser.cache.makeURIByBaseURI(manifest.imports[key], baseURI);
			if (this.loaded[url]) {
				// eslint-disable-next-line no-console
				console.warn(`Manifest [${url}] already loaded.`);
			} else {
				this.loaded[url] = true;
				await this.import(url, true);
			}
		}
	},

	async parseManifest(manifest, uri) {
		this.pushToMergeMap('/', null, uri);
		this.manifest = this.merge(this.manifest, manifest, uri);

		for (const section in manifest) {
			const node = manifest[section];
			switch (section) {
				case 'forms':
				case 'namespaces':
				case 'aspects':
				case 'docs':
				case 'contexts':
				case 'components':
				case 'rules':
				case 'datasets':
				case '$package':
					await this.parseEntity(node, `/${section}`, uri);
					break;
				/* Убрано чтобы разнести загрузку контента и импорты при решении зависимостей
				case 'imports': 
					await this.parseImports(node, uri);
					break;
				*/
			}
		}
	},

	async checkAwaitedPackages() {
		// пройтись по ожидающим пакетам и проверить зарезолвелнены ли их зависимости.
		// Если да - то распарсить их и убрать из ждунов
		const resolved = {};
		const awaitedTuples = Object.entries(this.awaitedPackages);
		if (!awaitedTuples?.length) return;

		this.awaitedPackages = Object.fromEntries(
			awaitedTuples.filter(([url, pkg]) => {
				if (this.isDepsResolved(url, pkg.$package)) {
					resolved[url] = pkg;
					return false;
				} else return true;
			})
		);

		const parsingPackages = Object.entries(resolved)
			.map(([uri, pkg]) =>
				this.parseManifest(pkg, uri)
			);

		await Promise.all(parsingPackages);

		Object.values(resolved).forEach(({ $package }) => {
			const [id, pkg] = Object.entries($package)[0];
			this.packages[id] = pkg;
		});

		return resolved;
	},

	isDepsResolved(uri, $pkg) {
		const [_, pkg] = Object.entries($pkg)[0];

		// если у пакета нет зависимостей то и нечего решать
		if (!pkg?.dependencies) return true;

		// если нет установленых пакетов то зависимости не решены
		const packageTuples = Object.entries(this.packages);
		if (!packageTuples?.length) return false;

		// проверяем все ли зависимости установлены
		return Object.entries(pkg.dependencies).every(([id, version]) => {
			// Зависимость установлена (есть в packages)?
			return packageTuples.find(([i, v]) => {
				if (id !== i) return false;

				if (!semver.satisfies(v.version, version)) {
					throw new PackageError(
						uri,
						`Не подходящая версия пакета "${id}". Требуется "${version}" но найдена "${v.version}"`
					);
				}
				return (id === i && semver.satisfies(v.version, version));
			});

		});
	},

	checkCycleDeps($package) {
		Object.entries(this.awaitedPackages).forEach(([uri, pkg]) => {
			const [aID, aPkg] = Object.entries(pkg.$package)[0];
			const [bID, bPkg] = Object.entries($package)[0];
			const aDeps = Object.keys(aPkg.dependencies);
			const bDeps = Object.keys(bPkg.dependencies);
			const aDepID = aDeps.find(id => bID === id);
			const bDepID = bDeps.find(id => aID === id);
			if (aDepID && bDepID) {
				throw new PackageError(
					uri,
					`Циклическая зависимость между пакетами ${aDepID} и ${bDepID}`
				);
			}
		});
	},

	checkLoaded() {
		const awaited = Object.entries(this?.awaitedPackages);
		if (awaited.length) {
			awaited.forEach(([uri, pkg]) => {
				const [id, $pkg] = Object.entries(pkg.$package)[0];
				const unresolved = Object.entries($pkg.dependencies).filter(([id, _]) =>
					!this.packages[id]
				)
					.map(([id, ver]) => `${id} (${ver})`)
					.join(', ');
				this.registerError(new PackageError(uri, `У пакета ${id} не разрешены зависимости ${unresolved}`), uri);
			});
		}
	},

	async import(uri) {
		console.log('import.uri', uri);
		try {
			const response = this.onPullSource 
				? await this.onPullSource(uri, '/', this)
				: await parser.cache.request(uri, '/');
			let manifest;
			if (uri.toLowerCase().endsWith('.md')) {
				const parts = response.data.split('---');
				if (parts.length === 1) manifest = {};
				else if (parts.length !== 3) throw new Error('Incorrect metadata of markdown file');
				else manifest = yaml.parse(parts[1]);
			} else manifest = response && (typeof response.data === 'object'
				? response.data
				: JSON.parse(response.data));

			// если манифест - пакет
			if (manifest?.$package) {
				const $package = manifest.$package;

				// если у пакета решены его зависимости
				// - парсим и складываем версию в установленные пакеты
				await this.parseImports(manifest, uri);
				if (parser.isDepsResolved(uri, $package)) {
					await this.parseManifest(manifest, uri);
					// TODO если пакет уже установлен с другой версией то что?
					const [id, pkg] = Object.entries($package)[0];
					this.packages[id] = pkg;
					await this.checkAwaitedPackages();
				}
				// иначе складываем пакет в ждуны
				else {
					this.checkCycleDeps(manifest.$package);
					this.awaitedPackages[uri] = manifest;
					return;
				}
			} else {
				await this.parseImports(manifest, uri);	
				await this.parseManifest(manifest, uri);
			} 

		} catch (e) {
			this.registerError(e, e.uri || uri);
		}
	}
};

export default parser;
