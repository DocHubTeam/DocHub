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
      rskabali <rskabali@mts.ru>
      Vladislav Markin <markinvy@yandex.ru>
  */

import Vue from 'vue';
import Router from 'vue-router';
import cookie from 'vue-cookie';

import gateway from '@idea/gateway';
import env from '@front/helpers/env';

import appRoutes from './routes';

Vue.use(Router);

const rConfig = {
	scrollBehavior() {
		window.scrollTo(0, 0);
	},
	routes: [
		...appRoutes
	]
};

if (!env.isPlugin()) {
	rConfig.mode = 'history';
	rConfig.routes.push(
		{
			path: '/',
			redirect() {
				window.location = new URL('/main', window.origin);
			}
		});
	rConfig.routes.push(
		{
			path: '/sso/gitlab/authentication',
			redirect(route) {
				const OAuthCode = Object.keys(route.query).length
					? route.query.code
					: new URLSearchParams(route.hash.substr(1)).get('code');
				if (OAuthCode) {
					// Диспатчим событие получения OAuth-кода
					window.Vuex.dispatch('onReceivedOAuthCode', OAuthCode);
					
					// Пытаемся получить сохраненный маршрут из cookie или localStorage
					let rRoute = cookie.get('return-route');
					const lsRoute = window.localStorage.getItem('original-route');
					
					// Предпочитаем localStorage, если там есть данные
					if (lsRoute) {
						rRoute = lsRoute;
					}
					
					if (rRoute) {
						try {
							const parsedRoute = JSON.parse(rRoute);
							
							// Сохраняем маршрут в localStorage для использования после авторизации
							// НЕ удаляем маршрут здесь, чтобы он был доступен после перезагрузки страницы
							window.localStorage.setItem('original-route', rRoute);
							
							// Очищаем cookie, так как данные уже в localStorage
							cookie.delete('return-route');
							
							// Возвращаем маршрут для редиректа
							return parsedRoute;
						} catch (e) {
							console.error('Error parsing saved route:', e);
							return {
								path: '/main',
								query: {},
								hash: ''
							};
						}
					} else {
						return {
							path: '/main',
							query: {},
							hash: ''
						};
					}
				} else {
					return {
						path: '/sso/error',
						query: {},
						hash: ''
					};
				}
			}
		}
	);
} else {
	rConfig.routes.push(
		{
			path: '/url=about:blank',
			redirect() {
				window.location = new URL('/url=main', window.location);
			}
		}
	);
}

const router = new Router(rConfig);

gateway.appendListener('navigate/component', (data) => {
	router.push({ path: `/architect/components/${Object.keys(data)[0]}`});
});

gateway.appendListener('navigate/document', (data) => {
	router.push({ path: `/docs/${Object.keys(data)[0]}`});
});

gateway.appendListener('navigate/aspect', (data) => {
	router.push({ path: `/architect/aspects/${Object.keys(data)[0]}`});
});

gateway.appendListener('navigate/context', (data) => {
	router.push({ path: `/architect/contexts/${Object.keys(data)[0]}`});
});

gateway.appendListener('navigate/devtool', (data) => {
	router.push({ path: `/devtool/${Object.keys(data)[0]}`});
});

export default router;
