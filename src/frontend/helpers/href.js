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

import env, {Plugins} from './env';
import routes from '@front/router/routes';
import uri from '@front/helpers/uri';

function isLocalRoute(url) {
	const urlRoot = url.pathname.split('/')[1];
	for (let i = 0; i < routes.length; i++) {
		const route = routes[i].path.split('/')[1];
		if (urlRoot === route) return true;
	}
	return false;
}

// Работа с ссылками
export default {
	// Переход по URL
	gotoURL(ref) {
		try {
			if (uri.isExternalURI(ref)) {
				window.open(ref, '_blank');
			} else {
				const url = new URL(ref, window.location);
				if (isLocalRoute(url)) {
					const fullPath = url.pathname + (url.search || '') + (url.hash || '');
					window.localStorage.setItem('last-visited-url', fullPath);
					window.Router.push({ 
						path: url.pathname, 
						query: Object.fromEntries(url.searchParams),
						hash: url.hash
					});
				} else {
					window.open(url, '_blank');
				}
			}
		} catch (e) {
			if (env.isPlugin(Plugins.idea)) {
				window.Router.push({ path: ref.split('#')[1]});
			}
		}
	},
	// Обрабатывает клик по ссылке
	onClickRef(event) {
		event.preventDefault();
		if (event.shiftKey) return false;
		const ref = event.currentTarget.href.baseVal || event.currentTarget.href;
		if (!ref.length) return false;
		this.gotoURL(ref);
		return false;
	},

	// Обрабатывает элемент для сормирование корректных ссылок в нем
	elProcessing(el) {
		const refs = el?.querySelectorAll && el.querySelectorAll('[href]') || [];
		for (let i = 0; i < refs.length; i++) {
			refs[i].onclick = (event) => this.onClickRef(event);
		}
	}
};
