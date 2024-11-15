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
import Vue from 'vue';
import Vuex from 'vuex';

// Initialize Vuex if not already done
Vue.use(Vuex);

// Create store if it doesn't exist
if (!window.$store) {
    window.$store = new Vuex.Store({
        state: {
            manifest: {
                components: {},
                aspects: {}
            }
        },
        mutations: {
            setManifest(state, manifest) {
                state.manifest = manifest;
            }
        }
    });
}

// Add index handling
let documentIndex = null;

// Load index on startup
async function loadDocumentIndex() {
  try {
    const response = await fetch('/build/document-index.json');
    documentIndex = await response.json();
    console.log('Document index loaded:', Object.keys(documentIndex).length, 'documents');
  } catch (error) {
    console.error('Failed to load document index:', error);
    documentIndex = {};
  }
}

// Initialize index
loadDocumentIndex();

// Add search functions
const searchFunctions = {
  // Get document from index
  getDocument: function(id) {
    return documentIndex[id];
  },

  // Search in document content
  searchContent: function(text) {
    console.log('Searching content for:', text);
    const searchText = text.toLowerCase();
    const results = Object.entries(documentIndex || {})
      .filter(([, doc]) => {
        const content = doc.content?.toLowerCase() || '';
        const headers = doc.headers?.map(h => h.text.toLowerCase()) || [];
        return content.includes(searchText) || headers.some(h => h.includes(searchText));
      })
      .map(([id, doc]) => ({
        id,
        title: doc.metadata.description,
        entity: 'document',
        link: `/docs/${id}`,
        score: searchFunctions.calculateScore(text, doc),
        matchedInContent: true,
        contentSnippet: doc.content.substring(0, 200) + '...'
      }));
    console.log('Content search results:', results);
    return results;
  },

  // Calculate relevance score
  calculateScore: function(searchText, doc) {
    const text = searchText.toLowerCase();
    let score = 0;

    // Score for title/description match
    if (doc.metadata?.description?.toLowerCase().includes(text)) score += 10;
    
    // Score for headers match
    const headerMatches = (doc.headers || []).filter(h => 
      h.text.toLowerCase().includes(text)
    ).length;
    score += headerMatches * 5;

    // Score for content match
    const contentMatches = (doc.content?.toLowerCase().match(new RegExp(text, 'g')) || []).length;
    score += contentMatches;

    // Score for keyword match
    if ((doc.keywords || []).some(k => k.toLowerCase().includes(text))) score += 3;

    return score;
  }
};

// Register functions with JSONata
if (jsonataDriver && typeof jsonataDriver.registerFunction === 'function') {
  Object.entries(searchFunctions).forEach(([name, fn]) => {
    jsonataDriver.registerFunction(name, fn);
  });
}

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

    // Сводна JSONSchema по всем кастомным сущностям
    entitiesJSONSchema() {
        return resolveJSONataRequest(queries.IDS.JSONSCEMA_ENTITIES);
    },

    // Сводная JSONSchema по всем кастомным сущностям
    getObject(id) {
        return resolveJSONataRequest(queries.IDS.GET_OBJECT, { OBJECT_ID: id });
    },

    // Add new search query
    search(searchText) {
        console.log('Search initiated with:', searchText);
        const expression = resolveJSONataRequest(queries.IDS.GLOBAL_SEARCH, { 
            SEARCH_TEXT: searchText 
        });
        return this.driver.evaluate(expression);
    },

    // Add new method for content search
    async searchWithContent(searchText) {
        console.log('Content search initiated with:', searchText);
        if (!documentIndex) {
            console.log('Loading document index...');
            await loadDocumentIndex();
        }

        // Get store data from Vuex state
        const store = window?.Vuex?.state?.manifest;
        
        // Log store access details for debugging
        console.log('Store access details:', {
            hasStore: !!store,
            componentsCount: store?.components ? Object.keys(store.components).length : 0,
            aspectsCount: store?.aspects ? Object.keys(store.aspects).length : 0,
            storeData: store // Log full store data
        });

        // First, search in content directly
        const contentResults = searchFunctions.searchContent(searchText);
        console.log('Content search results:', contentResults);

        // Search in components directly
        const componentResults = store?.components ? 
            Object.entries(store.components)
                .filter(([id, comp]) => {
                    const searchLower = searchText.toLowerCase();
                    const titleMatch = comp.title?.toLowerCase().includes(searchLower);
                    const idMatch = id.toLowerCase().includes(searchLower);
                    const techMatch = comp.technologies?.some(tech => 
                        tech.toLowerCase().includes(searchLower)
                    );
                    console.log('Component match check:', id, { titleMatch, idMatch, techMatch });
                    return titleMatch || idMatch || techMatch;
                })
                .map(([id, comp]) => ({
                    id,
                    title: comp.title || id,
                    entity: 'component',
                    link: `/entities/components/blank?dh-component-id=${id}`,
                    score: 5
                })) : [];
        
        console.log('Component search results:', componentResults);

        // Search in aspects directly
        const aspectResults = store?.aspects ?
            Object.entries(store.aspects)
                .filter(([id, asp]) => {
                    const searchLower = searchText.toLowerCase();
                    const titleMatch = asp.title?.toLowerCase().includes(searchLower);
                    const idMatch = id.toLowerCase().includes(searchLower);
                    const locationMatch = asp.location?.toLowerCase().includes(searchLower);
                    console.log('Aspect match check:', id, { titleMatch, idMatch, locationMatch });
                    return titleMatch || idMatch || locationMatch;
                })
                .map(([id, asp]) => ({
                    id,
                    title: asp.title || id,
                    entity: 'aspect',
                    link: `/entities/aspects/blank?dh-aspect-id=${id}`,
                    score: 5
                })) : [];

        console.log('Aspect search results:', aspectResults);

        // Combine all results
        const allResults = [
            ...componentResults,
            ...aspectResults,
            ...contentResults
        ].filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        ).sort((a, b) => (b.score || 0) - (a.score || 0));

        console.log('Final combined results:', allResults);
        return allResults;
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
