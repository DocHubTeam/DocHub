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

let anchorRun = 0;

const scrollToAnchor = (hash, deadline) => new Promise((resolve) => {
	const id = hash.slice(1);
	const run = ++anchorRun;
	const pollIntervalMs = 200;
	let lastTop = null;

	// The page content loads after the route is resolved, so the element may not
	// exist yet. Poll until it appears. Content above it can still grow after
	// that, so scroll again until its position stops changing.
	// Polling is used instead of MutationObserver: with many DOM updates the
	// observer froze the page.
	const tick = () => {
		// A newer navigation to an anchor has started. Stop this one.
		if (run !== anchorRun) {
			resolve();
			return;
		}

		const el = document.getElementById(id);

		if (!el) {
			if (Date.now() < deadline) {
				setTimeout(tick, pollIntervalMs);
			} else {
				window.scrollTo(0, 0);
				resolve();
			}
			return;
		}

		const top = el.getBoundingClientRect().top + window.scrollY;

		if (top !== lastTop) {
			el.scrollIntoView();
			lastTop = top;

			if (Date.now() < deadline) {
				setTimeout(tick, pollIntervalMs);
				return;
			}
		}

		resolve();
	};

	tick();
});

const rConfig = {
	scrollBehavior(to) {
		if (to.hash) {
			// Do not resolve with false: vue-router would then scroll back to the
			// position saved before the navigation. Keep the current position.
			return scrollToAnchor(to.hash, Date.now() + 30000)
				.then(() => ({ x: window.scrollX, y: window.scrollY }));
		}

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
					window.Vuex.dispatch('onReceivedOAuthCode', OAuthCode);
					const rRoute = cookie.get('return-route');
					return rRoute ? JSON.parse(rRoute) : {
						path: '/main',
						query: {},
						hash: ''
					};
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
