import config from '../../config'
import cookie from 'vue-cookie';
import GitHelper from '../helpers/gitlab'
import parser from '../manifest/manifest_parser';
import Vue from 'vue';
import query from "../manifest/query";
import jsonata from "jsonata";
import manifest_parser from "../manifest/manifest_parser";

const axios = require('axios');

export default {
    state: {
        // Признак загрузки данных
        is_reloading: true,
        // Токен досутпа в GitLab
        access_token: null,
        // Обобщенный манифест
        manifest: {},
        // Выявленные Проблемы
        problems: [],
        // Источники данных манифеста
        sources: [],
        // Доступные проекты GitLab
        available_projects: {},
        // Проекты
        projects: {},
        diff_format: 'line-by-line',
        // Последние изменения
        last_changes: {},
    },

    mutations: {
        setManifest(state, value) {
            state.manifest = value;
        },
        setSources(state, value) {
            state.sources = value;
        },
        setIsReloading(state, value) {
            state.is_reloading = value;
        },
        setAccessToken(state, value) {
            state.access_token = value;
            cookie.set('git_access_token', value, 1);
        },
        setDiffFormat(state, value) {
            state.diff_format = value;
            cookie.set('diff_format', value, 1);
        },
        appendLastChanges(state, value) {
            Vue.set(state.last_changes, value.id, value.payload);
        },
        appendProblems(state, value) {
            state.problems = jsonata("$distinct($)")
                .evaluate(JSON.parse(JSON.stringify(state.problems.concat(value))));
        },
    },

    actions: {
        // Action for init store
        init(context) {
            const access_token = cookie.get('git_access_token');
            if (access_token) {
                context.commit('setAccessToken', access_token);
                context.dispatch('reloadAll');
            }
            let diff_format = cookie.get('diff_format');
            context.commit('setDiffFormat', diff_format ? diff_format : context.state.diff_format);
            parser.onReloaded = (parser) => {
                context.commit('setManifest', parser.manifest);
                context.commit('setSources', parser.margeMap);
                context.commit('setIsReloading', false);
                context.commit('appendProblems', jsonata(query.problems())
                    .evaluate(parser.manifest[manifest_parser.MODE_AS_IS]) || []);
            };
            parser.onStartReload = () => {
                context.commit('setIsReloading', true);
            }
            parser.onError = (action, data) => {
                context.commit('appendProblems', [{
                    problem: "Сетевые ошибки",
                    route: data.error.config.url,
                    target: "_blank",
                    title: `${data.uri} [${data.error}]`
                }]);
            };
        },

        // Need to call when gitlab takes callback's rout with oauth code
        onReceivedOAuthToken(context, access_token) {
            context.commit('setAccessToken', access_token);
            context.dispatch('reloadAll');
        },

        // Reload root manifest
        reloadAll(context) {
            context.dispatch('reloadRootManifest');
        },

        // Search and set document by URI
        selectDocumentByURI(context, uri) {
            for (let key in context.state.docs) {
                let document = context.state.docs[key];
                if (document.uri.toString() === uri) {
                    context.dispatch('selectDocument', document);
                    break;
                }
            }
        },

        // Set selected document
        selectDocument(context, document) {
            context.commit('setSelectedDocument', document);
        },

        // Reload root manifest
        updateLastChanges(context) {
            let request = new function () {
                this.terminate = false;
                this.projects_tasks = {};

                this.loadLastChange = (doc) => {
                    axios({
                        method: 'get',
                        url: GitHelper.commitsListURI(doc.project_id, doc.branch, 1, doc.source, 1),
                        headers: {'Authorization': `Bearer ${context.state.access_token}`}
                    })
                        .then((response) => {
                            if (!this.terminate) {
                                context.commit('appendLastChanges', {
                                    id: doc.id,
                                    payload: response.data
                                });
                            }
                        });
                };

                this.stop = () => {
                    this.terminate = true;
                }
            };

            for (let id in context.state.docs) {
                let doc = context.state.docs[id];
                if ((doc.transport || '').toLowerCase() === 'gitlab') {
                    request.loadLastChange(doc);
                }
            }
        },

        // Reload root manifest
        reloadRootManifest() {
            parser.import(`gitlab:${config.root_manifest.project_id}:${config.root_manifest.branch}@dochub.json`);
        },

        // Регистрация проблемы
        registerProblem(context, problem) {
            context.commit('appendProblem', problem);
        }
    }
};
