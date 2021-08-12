import requests from '../helpers/requests';
import gitlab from "../helpers/gitlab";
import jsonata from 'jsonata';

let touchProjects = {};

export default {
    // Манифест перезагружен
    onReloaded: null,
    // Запущена перезагрузка манифеста
    onStartReload: null,
    // События по ошибкам (ошибки запросов)
    onError: null,
    // Счетчик запросов
    reqCounter : 0,
    incReqCounter() {
        this.reqCounter++;
        if (this.onStartReload && (this.reqCounter === 1))
            this.onStartReload(this);
    },
    decReqCounter() {
        this.reqCounter--;
        if(this.reqCounter === 0 && this.onReloaded)
            this.onReloaded(this);
    },
    // Режимы манифестов
    MODE_AS_IS : 'as-is', // Как есть
    MODE_AS_WAS : 'as-was', // Как было
    MODE_TO_BE : 'to-be', // Как будет
    // Журнал объединений
    margeMap: [],
    // Итоговый манифест
    manifest: null,
    // Сохраняет в карте склеивания данные
    pushToMargeMap(path, source, location) {
        this.margeMap.push({
            path: path || '/',
            source: JSON.stringify(source),
            location
        });
        if (typeof source === 'object') {
            for (const key in source) {
                this.pushToMargeMap(`${path || ''}/${key}`, source[key], location);
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
            result = JSON.parse(JSON.stringify(source));
            this.pushToMargeMap(path, result, location);
        } else if (Array.isArray(source)) {
            if (Array.isArray(destination)) {
                result = JSON.parse(JSON.stringify(destination)).concat(JSON.parse(JSON.stringify(source)));
            } else {
                result = JSON.parse(JSON.stringify(source));
            }
            this.pushToMargeMap(path, result, location);
        } else if (typeof source === 'object') {
            result = JSON.parse(JSON.stringify(destination));
            typeof result !== 'object' && (result = {});
            for (const id in source) {
                const keyPath = `${path || ''}/${id}`;
                if (result[id]) {
                    result[id] = this.merge(result[id], source[id], location, `${path || ''}/${id}`);
                } else {
                    result[id] = JSON.parse(JSON.stringify(source[id]));
                    this.pushToMargeMap(keyPath, result[id], location)
                }
            }
        } else {
            result = JSON.parse(JSON.stringify(source));
            this.pushToMargeMap(path, result, location);
        }
        return result;
    },

    // Возвращает контекст свойства по заданному пути
    // path - пусть к свойству
    getManifestContext (path) {
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
        }
    },

    // Декомпозирует свойство манифеста
    // Если свойство содержит ссылку, загружает объект
    // data - Значение свойства
    // path - пусть к совйству от корня манифеста
    expandProperty (data, path, baseURI) {
        // const data = this.getManifestContext(path).data;
        // Если значение является ссылкой, загружает объект по ссылке
        if (typeof data === 'string') {
            const URI = requests.makeURIByBaseURI(data, baseURI);
            this.incReqCounter();
            requests.request(URI).then((response) => {
                const context = this.getManifestContext(path);
                context.node[context.property] = response.data;
                this.touchProjects(URI);
            })
                .catch((e) => {
                    // eslint-disable-next-line no-console
                    console.error(e, `Ошибка запроса [${URI}]`, e);
                    this.onError && this.onError('net', {
                        uri: URI,
                        error: e
                    });
                })
                .finally(() => this.decReqCounter())
        }
    },
    // Разбираем сущности
    // path - путь к перечислению сущьностей (ключ -> объект)
    parseEntity(context, path, baseURI) {
        // const context = this.getManifestContext(path);
        for (const key in context) {
            this.expandProperty(context[key], `${path}/${encodeURIComponent(key)}`, baseURI);
        }
    },

    // Детектит обращение к проектам
    touchProjects (location, callback) {
        const projectID = requests.getGitLabProjectID(location);
        let URI;
        if (projectID && !touchProjects[projectID]) {
            touchProjects[projectID] = {};
            URI = gitlab.projectLanguagesURI(projectID);
            this.incReqCounter();
            requests.request(URI).then((response) => {
                callback('project/languages', {
                    projectID: projectID,
                    content: typeof response.data === "string" ? JSON.parse(response.data) : response.data,
                });
            })
                // eslint-disable-next-line no-console
                .catch((e) => {
                    // eslint-disable-next-line no-console
                    console.error(e, `Ошибка запроса [${URI}]`, e);
                    this.onError && this.onError('net', {
                        uri: URI,
                        error: e
                    });
                })
                .finally(() => this.decReqCounter())
        }
    },

    // Подключение манифеста
    import(uri, subimport) {
        if (!subimport) {
            this.manifest = {};
            this.margeMap = [];
            touchProjects = {};
            this.incReqCounter();
        }

        this.incReqCounter();
        this.touchProjects(uri, () => false);
        requests.request(uri).then((response) => {
            const manifest = typeof response.data === 'object' ? response.data : JSON.parse(response.data);

            // Определяем режим манифеста
            // eslint-disable-next-line no-unused-vars
            const mode = manifest.mode || this.MODE_AS_IS;
            this.manifest[mode] = this.merge(this.manifest[mode], manifest, uri);

            for (const section in manifest) {
                ['forms', 'namespaces', 'aspects', 'docs', 'contexts', 'components'].indexOf(section) >= 0
                && section !== 'imports' && this.parseEntity(manifest[section],`${mode}/${section}`, uri);
            }

            // Подключаем манифесты
            (jsonata('imports').evaluate(response.data) || []).map((importUri) => {
                this.import(requests.makeURIByBaseURI(importUri, uri), true);
            });
        })
        // eslint-disable-next-line no-console
        .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e, `Ошибка запроса [${uri}]`, e);
            this.onError && this.onError('net', {
                uri,
                error: e
            });
        })
        .finally(() => {
            this.decReqCounter();
        });

        !subimport && this.decReqCounter();
    }
};
