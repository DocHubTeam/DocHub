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

import jsonataDriver from '@global/jsonata/driver.mjs';
import queries from '@global/jsonata/queries.mjs';
import jsonataFunctions from '@global/jsonata/functions.mjs';
import env from '@front/helpers/env';
import requests from '@front/helpers/requests';


// Возвращает тело запроса в зависимости от платформы развертывания
function resolveJSONataRequest(ID, params) {
    let result = null;
    if (env.isBackendMode()) {
        result = `backend://jsonata/${encodeURIComponent(ID)}`;
        params && (result += `?params=${encodeURIComponent(JSON.stringify(params))}`);
    } else {
        result = queries.makeQuery(queries.QUERIES[ID], params);
    }
    return result;
}

const queryDriver = {
    driver: jsonataDriver,
    expression(expression, self_, params, isTrace, funcs) {
        return {
            driver: this.driver,
            expOrigin: null,
            onError: null,
            async evaluate(context, def) {
                let result = null;
                try {
                    if (expression.startsWith('backend://')) {
                        const url = new URL(expression);
                        [
                            { field: 'params', value: params},
                            { field: 'subject', value: self_}
                        ].map((param) => {
                            if (!param.value) return;
                            const oldValue = JSON.parse(url.searchParams.get(param.field));
                            const newValue = Object.assign({}, params, oldValue);
                            url.searchParams.set(param.field, JSON.stringify(newValue));
                        });
                        result = (await requests.request(url)).data;
                    } else if (!context && env.isBackendMode()) {
                        let url = `backend://jsonata/${encodeURIComponent(expression)}`;
                        url += `?params=${encodeURIComponent(JSON.stringify(params || null))}`;
                        url += `&subject=${encodeURIComponent(JSON.stringify(self_ || null))}`;
                        result = (await requests.request(url)).data;
                    } else {
                        !this.expOrigin && (this.expOrigin = this.driver.expression(expression, self_, params, isTrace || env.isTraceJSONata(), funcs));
                        result = await this.expOrigin.evaluate(context || window.Vuex.state.manifest || {});
                    }
                } catch (e) {
                    let message = null;
                    if (env.isBackendMode() && e?.request?.response) {
                        const content = typeof e?.request?.response === 'object' ? e?.request?.response : JSON.parse(e?.request?.response);
                        message = content.message;
                        // eslint-disable-next-line no-console
                        console.error(message);
                        throw new Error(message);
                    } else throw e;
                }
                return result || def;
            }
        };
    },

    // ********** МЕНЮ *************
    menu() {
        return resolveJSONataRequest(queries.IDS.USER_MENU);
    },

    // ********** ТЕХНОЛОГИИ ***********
    // Сбор информации об использованных технологиях
    collectTechnologies() {
        return resolveJSONataRequest(queries.IDS.TECHNOLOGIES);
    },
    // Карточка технологии
    summaryForTechnology(technology) {
        return resolveJSONataRequest(queries.IDS.TECHNOLOGY, { TECH_ID: technology });
    },

    // ********** СУЩНОСТИ ***********

    // Документы для сущности
    docsForSubject(entity) {
        return resolveJSONataRequest(queries.IDS.DOCUMENTS_FOR_ENTITY, { ENTITY: entity });
    },

    // Сводная JSONSchema по всем кастомным сущностям
    entitiesJSONSchema() {
        return resolveJSONataRequest(queries.IDS.JSONSCEMA_ENTITIES);
    },

    // Сводная JSONSchema по всем кастомным сущностям
    getObject(id) {
        return resolveJSONataRequest(queries.IDS.GET_OBJECT, { OBJECT_ID: id });
    },

    // Add new search query
    search(searchText) {
        return resolveJSONataRequest(queries.IDS.GLOBAL_SEARCH, { SEARCH_TEXT: searchText });
    }
};

// Кэш для пользовательских функций
const cacheFunction = {
    moment: null,
    functions: null
};

// Регистрация пользовательских функций
jsonataDriver.customFunctions = () => {
    const state = window.Vuex?.state || {};
    if (!state.moment) return {};
    if (cacheFunction.moment && (cacheFunction.moment === state.moment))
        return cacheFunction.functions;

    const result = (cacheFunction.functions = jsonataFunctions(queryDriver, state?.manifest?.functions || {}));

    cacheFunction.moment = state.moment;
    return result;
};

export default queryDriver;
