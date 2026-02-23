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
      // Нормализуем ссылку относительно текущего URL
      const normalizedRef = this.normalizeRef(ref, window.location.href);

      if (uri.isExternalURI(normalizedRef)) {
        window.open(normalizedRef, 'blank_');
      } else {
        const url = new URL(normalizedRef, window.location);
        if (isLocalRoute(url)) {
          window.Router.push({
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            hash: url.hash || '' // Сохраняем hash
          });
        } else
          window.open(url, 'blank_');
      }
    } catch (e) {
      if (env.isPlugin(Plugins.idea)) {
        // Для IDEA плагина тоже сохраняем якорь
        const [path, hash] = ref.split('#');
        window.Router.push({
          path: path,
          hash: hash ? `#${hash}` : ''
        });
      }
    }
  },
// Обрабатывает клик по ссылке
  onClickRef(event) {
    event.preventDefault();
    if (event.shiftKey) return false;

    // Получаем href из разных возможных источников
    const ref = event.currentTarget.href.baseVal ||
      event.currentTarget.href ||
      event.currentTarget.getAttribute('href');

    if (!ref || !ref.length) return false;

    // Сохраняем информацию о том, как был открыт якорь
    if (event.ctrlKey || event.metaKey) {
      // Для Ctrl+клик открываем в новой вкладке с сохранением якоря
      const url = new URL(ref, window.location);
      window.open(url.href, '_blank');
    } else {
      this.gotoURL(ref);
    }
    return false;
  },

	// Обрабатывает элемент для сормирование корректных ссылок в нем
	elProcessing(el) {
		const refs = el?.querySelectorAll && el.querySelectorAll('[href]') || [];
		for (let i = 0; i < refs.length; i++) {
			refs[i].onclick = (event) => this.onClickRef(event);
		}
	},
  // Вспомогательный метод для обработки относительных ссылок
  normalizeRef(ref, base) {
    try {
      // Пробуем распарсить как полный URL
      return new URL(ref, base).href;
    } catch {
      // Если не получилось, возвращаем как есть
      return ref;
    }
  }
};
