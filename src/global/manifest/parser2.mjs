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
  */

// Обновленная версия парсера со слоистым хранением данных
// предназначен для максимально быстрого применения изменений
// в манифестах

import cache from './services/cache.mjs'; // Сервис управления кэшем
import * as semver from 'semver'; // Управление версиями  
import prototype from './prototype.mjs';
import yaml from 'yaml';

// Кладовка
// https://github.com/douglascrockford/JSON-js

class PackageError extends Error {
    constructor(uri, message) {
        super(message);
        this.name = 'Package';
        this.uri = uri;
    }
}

// Парсер манифестов
const parser = {
    checkLoaded() { return true; },
    checkAwaitedPackages() { return true; },
    // Корневые страницы
    rootLayers: [],
    // Слои данных 
    layers: [],
    // Пакеты и их зависимости
    packages: {},
    // Номер транзакции
    transaction: 0,
    // Обработчик события запуска парсинга манифеста
    onStartReload: null,
    // Публичный корневой объект манифеста
    manifest: null,
    // Очищает незадействованные слои в текущей транзакции
    cleanLayers() {
        const result = [];
        this.layers.map((layer) => {
            if (layer.transaction === this.transaction) {
                result.push(layer);
            } else layer.free();
        });
    },
    // Очистка состояния
    clean() {
        this.transaction++;
        this.cleanLayers();
        this.packages = {};
        this.rootLayers = [];
        this.layers = [];
    },
    startLoad() {
        // Обновляем счетчик операций
        this.transaction++;
        this.onStartReload && this.onStartReload(this);
    },
    // Возвращает верхний слой
    getTopLayer() {
        return this.layers[this.layers.length - 1];
    },
    stopLoad() {
        this.rebuildLayers();
        this.onReloaded && this.onReloaded(this);
    }
};

//  
// Очищает незадействованные слои в текущей транзакции
parser.cleanLayers = function() {
    const result = [];
    this.layers.map((layer) => {
        if (layer.transaction === this.transaction) {
            result.push(layer);
        } else layer.free();
    });
};


parser.mergeMap = new Proxy({}, {
    get(target, path) {
        let node = parser.manifest;
        if (!node || (typeof path !== 'string') || path.startsWith('__'))
            return target[path];
        let uri = null;
        const nodes = path.split('/');
        // if (path.endsWith('summary')) debugger;
        for (const i in nodes) {
            const nodeId = nodes[i];
            if (!nodeId) continue;
            if (typeof node === 'object') {
                uri = node.__uriOf__(nodeId);
            } else break;
            node = node?.[nodeId];
        }
        return uri ? [uri] : [];
    }
});


// Создает управляемый объект
// destination - Объект с которым происходит объединение. Низкий приоритет.
// source - Объект с которым происходит объединение. Высокий приоритет.
function ManifestObject(destination, source, owner) {
    // Если объект уже ранее создан другим слоем, встраиваемся в цепочку
    if (destination) {
        this.__proto__ = destination.__self__;
        // destination.__child__ = this;
    }

    const makeProp = (propName, value, oldValue) => {
        if (Array.isArray(value)) {
            Object.defineProperty(this, propName, {
                enumerable: true,
                configurable: true,
                get: () => {
                    // Конкатенируем массив с уникальными значениями
                    let result = [];
                    if (Array.isArray(oldValue)) {
                        const temp = [];
                        for (const i in oldValue) {
                            const distItem = oldValue[i];
                            const distContent = JSON.stringify(distItem);
                            if (!value.find((srcItem, index) => {
                                !temp[index] && (temp[index] = JSON.stringify(srcItem));
                                return distContent === temp[index];
                            })) {
                                result.push(distItem);
                            }
                        }
                        result = value.concat(result);
                    } else {
                        result = value;
                    }
                    return result;
                }
            });
        } else if (typeof value === 'object') {
            Object.defineProperty(this, propName, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: createManifestObject(typeof oldValue === 'object' ? oldValue : null, value, owner)
            });
        } else {
            Object.defineProperty(this, propName, {
                enumerable: true,
                configurable: true,
                writable: true,
                value
            });
        }
    };

    // создаем свойства слоя
    for (const propName in source) {
        makeProp(propName, source[propName], destination?.[propName]);
    }

    owner.appendObject(this);
}

// Прокси для объектов манифестов
const createManifestObject = (destination, source, owner) => {
    const subject = new ManifestObject(destination, source, owner);
    let $prototype = null;

    // Устанавливает прототип по свойству $prototype
    const setPrototype = (section, key) => {
        $prototype = { section, key };
    };

    const allProps = () => {
        const result = [];
        for (const propId in subject) result.push(propId);
        // Подмешиваем свойства прототипа если он задан
        if ($prototype && parser.manifest) {
            const prototype = parser.manifest[$prototype.section]?.[$prototype.key] || {};
            for (const propId in prototype)
                result.indexOf(propId) < 0 && result.push(propId);
        }
        return result;
    };

    return new Proxy(subject, {
        get: (target, propId) => {
            switch (propId) {
                case '__self__': return subject;
                case '__uri__': return owner.uri;
                case '__uriOf__': return (propId) => {
                    if (source && Object.hasOwn(source, propId)) return owner.uri;
                    else if (destination) return destination.__uriOf__(propId);
                    else return null;
                };
                case '__setPrototype__': return setPrototype;
                default: {
                    let result = subject[propId];
                    $prototype && (result === undefined)
                        && (result = parser.manifest[$prototype.section]?.[$prototype.key]?.[propId]);
                    return result;
                }
            }
        },
        enumerate: () => allProps(),
        iterate: () => allProps(),
        ownKeys: () => allProps(),
        getPropertyNames: () => allProps(),
        getOwnPropertyNames: () => allProps(),
        getOwnPropertyDescriptor: () => ({
            enumerable: true,
            configurable: true
        })
    });
};



// Объект файла манифеста
function ManifestLayer(owner) {
    // Текущий идентификатор ресурса слоя
    this.uri = null;
    // Текущий статус слоя
    this.status = null;
    // Импорты
    this.imported = [];
    // Объекты манифеста принадлежащие слою
    const objects = [];
    // Данные манифеста
    this.manifest = null;
    this.appendObject = (object) => {
        objects.push(object);
    };
    // Признак участие в транзакции
    this.transaction = parser.transaction;
    // Корневой объект данных
    let rootObject = null;
    Object.defineProperty(this, 'object', {
        enumerable: false,
        configurable: false,
        get: () => {
            return rootObject;
        }
    });
    Object.defineProperty(this, 'owner', {
        enumerable: false,
        configurable: false,
        get: () => {
            return owner;
        }
    });

    // Подключаем импортируемые манифесты
    const imports = () => {
        return new Promise((success, reject) => {
            const imports = this.manifest.imports || [];
            const limit = Math.max(imports.length, this.imported.length);
            let counter = 0; // Счетчик отложенных запросов на загрузку слоев
            if (!limit) {
                success();
                return;
            }
            for (let i = 0; i < limit; i++) {
                const import_ = imports[i];
                let imported_ = this.imported[i];
                // Формируем URI загружаемого манифеста
                const uri = import_ ? cache.makeURIByBaseURI(import_, this.uri) : null;
                if (!uri && imported_) { // Если ресурс вышел из игры очищаем его, но не перестраиваем стек слоев
                    imported_.free();
                } else if (imported_?.uri === !!uri) { // !!!!!!!!!!!!!!!!!!!!
                    const message = `Манифест [${uri}] уже подключен в [${parser.loaded[uri].parent.uri}].`;
                    // eslint-disable-next-line no-console
                    console.warn(message);
                } else if (uri !== imported_?.uri) { // Если слой занят другим манифестом перестраиваем его или создаем новый
                    ++counter;
                    !imported_ && (this.imported[i] = imported_ = new ManifestLayer(this));
                    imported_
                        .reload(uri)
                        .then(() => !--counter && success())
                        .catch(reject);
                }  // Иначе не трогаем слой

                imported_ && (imported_.transaction = parser.transaction);
            }
            // Если мы не ждем загрузку, сразу разрешаем промис
            !counter && success();
        });
    };

    // Монтирует слой в стек
    this.mounted = (parent) => {
        rootObject = createManifestObject(parent?.object, this.manifest, this);
    };

    // Загружает слой 
    this.reload = (uri) => {
        return new Promise((success, reject) => {
            // Указываем в рамках какой транзакции преобразование
            this.transaction = parser.transaction;
            // Устанавливаем текущий идентификатор ресурса
            this.uri = uri;
            // Отправляем загрузку манифеста в очередь
            parser.pushRequest(uri, this).then((manifest) => {
                // Сохраняем полученные данные манифеста
                this.manifest = manifest;
                // Проверяем пустой ли манифест
                if (!manifest) {
                    // todo возможно стоит сообщать о том, что подключен пустой манифест
                    success();
                    return;
                }
                // Загружаем все импорты
                imports().then(success).catch(reject);
            }).catch(reject);
        });
    };

    // Освобождает слой от данных
    this.free = () => {
        // Освобождаем все связанные слои
        this.imported.map((item) => item.free());
        this.imported = [];
        // Освобождаем данные
        for (const i in objects) {
            delete objects[i];
        }
        this.objects = [];
        // Освобождаем ссылку на ресурс
        this.uri = null;
    };

}

// ************************************************************************
// 				        Обработка ошибок
// ************************************************************************

//Регистрирует ошибку
// e - объект ошибки
// uri - источник ошибки
parser.registerError = function(e, uri) {
    const errorPath = `$errors/requests/${new Date().getTime()}`;
    // eslint-disable-next-line no-console
    console.error(e, `Ошибка запроса [${errorPath}:${uri}]`, e);
    try {
        if (typeof e === 'string') e = JSON.parse(e);
    } catch (e) { true; }
    let errorType = (() => {
        switch (e.name) {
            case 'YAMLSyntaxError':
            case 'YAMLSemanticError':
                return 'syntax';
            case 'TypeError':
                return 'core';
            case 'EntryIsADirectory (FileSystemError)':
                return 'file-system';
            case 'Package':
                uri = e.uri;
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


    // ************************************************************************
    // 				Загрузка контента и разрешение зависимостей
    // ************************************************************************

    // Если обработчик определен, он вызывается при запросе ресурса
    // По умолчанию используется request модуль

    parser.onPullSource = null;

// Информация о загружаемых ресурсах
parser.sourceLoading = {};

// Функция сканирования дерева слоев
// callback - вызывается для каждого слоя. Если возвращает true, 
//            сканирование останавливается и возвращается слой
parser.findLayers = function(callback) {
    const expandItem = (item) => {
        let result = null;
        try {
            for (const i in item.imported) {
                const layer = item.imported[i];
                result = expandItem(layer);
                if (result) return result;
            }
            return callback(item) && item;
        } catch (e) {
            this.registerError(e, e?.uri || item.uri);
        }
    };

    for (const i in this.rootLayers) {
        const result = expandItem(this.rootLayers[i]);
        if (result) return result;
    }

    return null;
};

parser.pushRequest = function(uri, owner) {
    // Проверяем не загружен ли уже ресурс
    const loadedLayer = this.findLayers((layer) => {
        return (layer !== owner) && (layer.transaction === parser.transaction) && (layer.uri === uri);
    });
    // Если ресурс уже загружен или загружается формируем ошибку и игнорируем загрузку
    if (loadedLayer) {
        parser.registerError(new PackageError(uri, `Дублирование импорта манифеста [${uri}] в [${owner?.owner?.uri || ''}]!`));
        return new Promise((success) => success(null));
    }

    // Выбираем ручку для загрузки
    let request;
    if (this.onPullSource)
        request = this.onPullSource(uri, '/', this);
    else
        request = this.cache.request(uri, '/');

    // Создаем запрос
    return new Promise((success, reject) => {
        request.then((response) => {
            // Удаляем из загрузок ресурс
            delete parser.sourceLoading[uri];
            if (response.headers?.['content-type'].match(/^.*\/markdown($|;.*$)/) || uri.endsWith('.md')) {
                const parts = response.data.split('---');
                if (parts.length === 1) success({});
                else if (parts.length !== 3) reject(new Error('Incorrect metadata of markdown file'));
                else success(yaml.parse(parts[1]));
            } else success(response && (typeof response.data === 'object'
                ? response.data
                : JSON.parse(response.data))
            );
        }).catch(reject);
    });
};

// Пересобирает слои из графа страниц
parser.rebuildLayers = function() {
    let level = 0;

    // Страницы ожидающие разрешения зависимостей
    let captives = [];

    // Очищаем информацию о подключенных пакетах
    this.packages = {};

    // Проверяет подключен ли нужный пакет
    const getUnresolvedDeps = (layer) => {
        const unresolved = [];
        const $package = layer.manifest?.$package || {};
        for (const packageId in $package) {
            const dependencies = $package[packageId].dependencies || {};
            for (const depId in dependencies) {
                const version = this.packages[depId];
                const depVersion = dependencies[depId];
                if (!semver.satisfies(version, depVersion)) {
                    if (this.packages[depId])
                        throw new PackageError(layer.uri,
                            `Пакет [${packageId}] подключен, но его версия [${version}] не удовлетворяет зависимости [${depVersion}].`
                        );
                    else unresolved.push({ depId, version: depVersion, layer });
                }
            }
        }

        return unresolved.length ? unresolved : null;
    };

    // Функция монтирования слоя
    const mountLayer = (layer) => {
        layer.mounted(this.layers[level - 1]);
        this.layers[level] = layer;
        ++level;
    };

    // Функция разрешения зависимостей
    const resolveDeps = (layer) => {
        // Если все зависимости разрешены
        if (getUnresolvedDeps(layer)) {
            captives.indexOf(layer) < 0 && captives.push(layer); // Если не вышло, записываемся в ждуны
            return false;
        } else {
            mountLayer(layer); // Иначе монтируем слой
        }
        // Подключаем пакет и разрешаем ожидающие зависимости
        const $package = layer.manifest?.$package;
        // Если в манифесте задекларированы пакеты
        if ($package) {
            // Сканируем их
            for (const packageId in $package) {
                const version = $package[packageId].version;
                if (!version)
                    throw new PackageError(layer.uri,
                        `Не определена версия пакета для [${packageId}]!`);
                if (this.packages[packageId])
                    throw new PackageError(layer.uri,
                        `Конфликт версий пакета [${packageId}] в манифесте [${layer.uri}].`
                        + ` Попытка подключения версии [${version}]`
                        + ` при наличии [${this.packages[packageId]}].`);
                // Устанавливаем флаг подключенного пакета
                this.packages[packageId] = version;
            }
            (captives = captives.map((item) => item && resolveDeps(item) ? item : undefined));
        }
        return true;
    };

    const expandItem = (item) => {
        try {
            item.imported.map(expandItem);
            resolveDeps(item);
        } catch (e) {
            this.registerError(e, e?.uri || item.uri);
        }
    };

    this.rootLayers.map(expandItem);

    // Выводим ошибки по неразрешенным зависимостям
    captives.map((layer) => {
        getUnresolvedDeps(layer).map((problem) => {
            this.registerError(new PackageError(layer.uri,
                `Неразрешена зависимость для [${problem.depId}@${problem.version}]!`));
        });
    });

    // Обновляем ссылку на манифест
    //this.manifest = prototype.expandAll({__proto__: this.layers[level - 1]?.object});
    const topObject = this.layers[level - 1]?.object;
    this.manifest = prototype.expandAll(Object.assign({ __uriOf__: topObject.__uriOf__ }, topObject));
};


// ************************************************************************
// 				Обработка событий точечных изменений
// ************************************************************************
// Функция вызывается извне при изменении в источника
// sources - массив с URI изменившихся источников
parser.isChangeProcessing = false;
parser.onChange = async function(sources) {
    if (!sources && !sources.length) return;
    // Флаг изменений
    let isAffected = false;
    // Увеличиваем индекс транзакции
    this.transaction++;
    for (const i in this.layers) {
        const layer = this.layers[i];
        // Если слой уже был затронут текущей транзакцией не трогаем его
        if (layer.transaction === this.transaction) continue;
        // Если слой входит в список изменений - перезагружаем его
        // eslint-disable-next-line no-console
        if (sources.indexOf(layer.uri) >= 0) {
            // eslint-disable-next-line no-console
            isAffected = true;
            try {
                await layer.reload(layer.uri);
            } catch (e) {
                this.registerError(e, e?.uri || layer.uri);
            }
        }
    }
    // Если в данных есть изменения - перестраиваем слои
    if (isAffected) {
        // Вызываем слушателя начала обновления данных в манифесте
        this.onStartReload && this.onStartReload();
        parser.rebuildLayers();
        // Вызываем слушателя окончания обновления данных в манифесте
        this.onReloaded && this.onReloaded(this);
    } else {
        // eslint-disable-next-line no-console
        console.info('>>>>>> No found layer for ', sources);
    }
};


// Импорт манифеста по идентификатору ресурса
//	uri - идентификатор ресурса
parser.import = async function(uri) {
    try {
        // Создаем рутовую страницу
        const rooLayer = new ManifestLayer();
        // Кладем ее в каталог
        this.rootLayers.push(rooLayer);
        // И запускаем загрузку
        await rooLayer.reload(uri);
    } catch (e) {
        this.registerError(e, e?.uri || uri);
    }
};

// Менеджер манифестов
export default parser;

