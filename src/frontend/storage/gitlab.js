import config from '@front/config';
import cookie from 'vue-cookie';
// import GitHelper from '../helpers/gitlab';
import storageManager from '@front/manifest/manager';
import Vue from 'vue';
import requests from '@front/helpers/requests';
import gateway from '@idea/gateway';
import consts from '@front/consts';
import rules from '@front/helpers/rules';
import crc16 from '@global/helpers/crc16';
import entities from '@front/entities/entities';
import env, { Plugins } from '@front/helpers/env';
import plugins from '../plugins/plugins';

import GitLab from '@front/helpers/gitlab';

import validatorErrors from '@front/constants/validators';

const axios = require('axios');

const NET_CODES_ENUM = {
	NOT_FOUND: 404
};

export default {
	modules: {
		plugins
	},
	state: {
		// Признак загрузки данных
		isReloading: true,
		// Признак рендеринга в версии для печати
		isPrintVersion: false,
		// Признак полноэкранности диаграмм
		isFullScreenMode: false,
		// Идет процесс авторизации в gitlab
		isOAuthProcess: null,
		// Токен досутпа в GitLab
		access_token: null,
		// Токен бновления access_token досутпа в GitLab
		refresh_token: null,
		// Время обновления данных
		moment: null,
		// Обобщенный манифест
		manifest: {},
		// Выявленные Проблемы
		problems: [],
		// Источники данных манифеста
		sources: {},
		// Доступные проекты GitLab
		available_projects: {},
		// Проекты
		projects: {},
		diff_format: 'line-by-line',
		// Последние изменения
		last_changes: {},
		// Движок для рендеринга
		renderCore: 'graphviz',
		// Признак инциализации проекта в плагине
		notInited: null,
		// Признак критической проблемы
		criticalError: null
	},

	mutations: {
		clean(state) {
			state.manifest = {};
			state.problems = [];
			state.sources = {};
			state.available_projects = {};
			state.projects = {};
			state.last_changes = {};
			state.criticalError = null;
		},
		setManifest(state, value) {
			state.moment = Date.now();
			state.manifest = value;
		},
		setSources(state, value) {
			state.sources = value;
		},
		setIsOAuthProcess(state, value) {
			state.isOAuthProcess = value;
		},
		setIsReloading(state, value) {
			state.isReloading = value;
		},
		setAccessToken(state, value) {
			state.access_token = value;
		},
		setRefreshToken(state, value) {
			state.refresh_token = value;
		},
		setDiffFormat(state, value) {
			state.diff_format = value;
			cookie.set('diff_format', value, 1);
		},
		appendLastChanges(state, value) {
			Vue.set(state.last_changes, value.id, value.payload);
		},
		appendProblems(state, value) {
			state.problems = state.problems.concat([value]);
		},
		setRenderCore(state, value) {
			state.renderCore = value;
		},
		setNoInited(state, value) {
			state.notInited = value;
		},
		setCriticalError(state, value) {
			state.criticalError = value;
		},
		setPrintVersion(state, value) {
			state.isPrintVersion = value;
		},
		setFullScreenMode(state, value) {
			state.isFullScreenMode= value;
		}
	},

	actions: {
		// Action for init store
		init(context) {
			context.dispatch('plugins/init');

			const errors = {
				syntax: null,
				net: null,
				package: null
			};

			context.commit('setRenderCore',
				env.isPlugin(Plugins.idea) ? 'smetana' : 'graphviz'
			);

			let diff_format = cookie.get('diff_format');
			context.commit('setDiffFormat', diff_format ? diff_format : context.state.diff_format);

			storageManager.onReloaded = (parser) => {
				// Очищаем прошлую загрузку
				context.commit('clean');
				// Регистрируем обнаруженные ошибки
				errors.syntax && context.commit('appendProblems', errors.syntax);
				errors.net && context.commit('appendProblems', errors.net);
				errors.missing_files && context.commit('appendProblems', errors.missing_files);
				errors.package && context.commit('appendProblems', errors.package);

				const manifest = Object.freeze(parser.manifest);
				// Обновляем манифест и фризим объекты
				context.commit('setManifest', manifest);
				context.commit('setSources', parser.mergeMap);
				context.commit('setIsReloading', false);
				if (!Object.keys(context.state.manifest || {}).length) {
					context.commit('setCriticalError', true);
				}

				entities(manifest);
				rules(manifest,
					(problems) => context.commit('appendProblems', problems),
					(error) => {
						// eslint-disable-next-line no-console
						console.error(error);
						context.commit('appendProblems', error);
					});
			};
			storageManager.onStartReload = () => {
				errors.syntax = null;
				errors.net = null;
				errors.missing_files = null;
				errors.package = null;

				context.commit('setNoInited', null);
				context.commit('setIsReloading', true);
			};
			storageManager.onError = (action, data) => {
				const error = data.error || {};
				const url = (data.error.config || { url: data.uri }).url;
				const uid = '$' + crc16(url);
				if (action === 'syntax') {
					if (!errors.syntax) {
						errors.syntax = {
							id: '$error.syntax',
							title: validatorErrors.title.syntax,
							items: [],
							critical: true
						};
					}
					const source = error.source || {};
					const range = source.range || {};
					if (!errors.syntax.items.find((item) => item.uid === uid)) {
						errors.syntax.items.push({
							uid,
							title: url,
							correction: validatorErrors.correction.in_file,
							description: `${validatorErrors.description.manifest_syntax}:\n\n`
								+ `${error.toString()}\n`
								+ `${validatorErrors.parts.code}: ${source.toString()}`
								+ `${validatorErrors.parts.range}: ${range.start || '--'}..${range.end || '--'}`,
							location: url
						});
					}
				} else if (data.uri === consts.plugin.ROOT_MANIFEST || action === 'file-system') {
					context.commit('setNoInited', true);
				} else if (action === 'package') {
					if (errors.package?.items.find(({ description }) => description === `${error.toString()}\n`)) return;
					if (!errors.package) {
						errors.package = {
							id: '$error.package',
							items: [],
							critical: true
						};
					}
					const item = {
						uid,
						title: url,
						correction: 'Проверь зависимости',
						description: '',
						location: url
					};

					item.description = `${error.toString()}\n`;
					errors.package.items.push(item);
				} else {
					const item = {
						uid,
						title: url,
						correction: '',
						description: '',
						location: url
					};

					if (error.response?.status === NET_CODES_ENUM.NOT_FOUND) {
						if (!errors.missing_files) {
							errors.missing_files = {
								id: '$error.missing_files',
								items: [],
								critical: true
							};
						}

						item.correction = validatorErrors.correction.missing_files;
						item.description = `${validatorErrors.description.missing_files}:\n\n`
							+ `${url.split('/').splice(3).join(' -> ')}\n`;
						errors.missing_files.items.push(item);
					} else {
						if (!errors.net) {
							errors.net = {
								id: '$error.net',
								items: [],
								critical: true
							};
						}

						item.correction = validatorErrors.correction.net;
						item.description = `${validatorErrors.description.net}:\n\n`
							+ `${error.toString()}\n`;
						errors.net.items.push(item);
					}

					context.commit('setIsReloading', false);
				}
			};

			if (env.isPlugin()) {
				storageManager.onPullSource = (url, path, parser) => {
					return parser.cache.request(url, path);
				};
			}

			context.dispatch('reloadAll');

			let changes = {};
			let refreshTimer = null;

			function reloadSourceAll(data) {
				if (data) {
					changes = Object.assign(changes, data);
					if (refreshTimer) clearTimeout(refreshTimer);
					refreshTimer = setTimeout(() => {
						const sources = context.state.sources['/'] || [];
						for (const source in changes) {
							if (source === consts.plugin.ROOT_MANIFEST) {
								// eslint-disable-next-line no-console
								console.info('>>>>>> GO RELOAD BY ROOT MANIFEST <<<<<<<<<<');
								context.dispatch('reloadAll');
								return;
							} else if (requests.isUsedURL(source)) {
								if (sources.indexOf(requests.getIndexURL(source)) >= 0) {
									// eslint-disable-next-line no-console
									console.info('>>>>>> GO RELOAD BY SOURCE <<<<<<<<<<', source);
									context.dispatch('reloadAll');
									return;
								} else {
									// eslint-disable-next-line no-console
									console.info('>>>>>> ON CHANGED SOURCE <<<<<<<<<<', source);
									// Уведомляем об изменениях всех подписчиков
									window.EventBus.$emit(consts.events.CHANGED_SOURCE, source);
								}
							}
						}
					}, 350);
				}
			}

			gateway.appendListener('source/changed', reloadSourceAll);
		},

		// Вызывается при необходимости получить access_token
		refreshAccessToken(context, OAuthCode) {
			const params = OAuthCode ? {
				grant_type: 'authorization_code',
				code: OAuthCode
			} : {
				grant_type: 'refresh_token',
				refresh_token: context.state.refresh_token
			};

			if (OAuthCode) context.commit('setIsOAuthProcess', true);

			const OAuthURL = (new URL('/oauth/token', config.gitlab_server)).toString();

			axios({
				method: 'post',
				url: OAuthURL,
				params: Object.assign({
					client_id: config.oauth.APP_ID,
					redirect_uri: (new URL(consts.pages.OAUTH_CALLBACK_PAGE, window.location)).toString()
				}, params)
			})
				.then((response) => {
					context.commit('setAccessToken', response.data.access_token);
					context.commit('setRefreshToken', response.data.refresh_token);
					setTimeout(() => context.dispatch('refreshAccessToken'), (response.data.expires_in - 10) * 1000);
					if (OAuthCode) context.dispatch('reloadAll');
				}).catch((e) => {
					context.commit('appendProblems', [{
						problem: validatorErrors.title.net,
						route: OAuthURL,
						target: '_blank',
						title: `${validatorErrors.title.gitlab_auth} [${e.toString()}]`
					}]);
					// eslint-disable-next-line no-console
					console.error(validatorErrors.title.gitlab_auth, e);
				}).finally(() => context.commit('setIsOAuthProcess', false));
		},

		// Need to call when gitlab takes callback's rout with oauth code
		onReceivedOAuthCode(context, OAuthCode) {
			context.dispatch('refreshAccessToken', OAuthCode);
		},

		// Reload root manifest
		async reloadRootManifest(_context, payload) {
			// Если работаем в режиме backend, берем все оттуда
			if (env.isBackendMode()) {
				storageManager.onStartReload();
				storageManager.onReloaded({
					manifest: Object.freeze({}),
					mergeMap: Object.freeze({})
				});
			} else {
				await storageManager.reloadManifest(payload);
			}
		},

		// Reload root manifest
		reloadAll(context, payload) {

			context.dispatch('reloadRootManifest', payload);
		},

		// Reload root manifest
		updateLastChanges(context) {
			let request = new function() {
				this.terminate = false;
				this.projects_tasks = {};

				this.loadLastChange = (doc) => {
					axios({
						method: 'get',
						url: GitLab.commitsListURI(doc.project_id, doc.branch, 1, doc.source, 1),
						headers: { 'Authorization': `Bearer ${context.state.access_token}` }
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
				};
			};

			for (let id in context.state.docs) {
				let doc = context.state.docs[id];
				if ((doc.transport || '').toLowerCase() === 'gitlab') {
					request.loadLastChange(doc);
				}
			}
		},

		// Регистрация проблемы
		registerProblem(context, problem) {
			context.commit('appendProblem', problem);
		}
	}
};
