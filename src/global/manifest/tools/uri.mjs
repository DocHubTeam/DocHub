  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2023 Sber

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
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Markin, Sber - 2023
  */

import gitlabDriver from '../../gitlab/driver.mjs';
import bitbucketDriver from '../../bitbucket/driver.mjs';

export default function(config) {
	const gitlab = new gitlabDriver(config);
	const bitbucket = new bitbucketDriver(config);
	this.isURL= (url) => {
		// eslint-disable-next-line no-useless-escape
		return url && url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
	};
	this.isExternalURI = (uri) => {
		return (uri.slice(0, window.origin.length) !== window.origin) && this.isURL(uri);
	};
	this.makeURIByBaseURI = (uri, baseURI) => {
		// if (('' + uri).startsWith('gitlab:')) debugger;
		let result;
		// Анализируем URI
		try {
			// Если URI ссылка на прямой ресурс, оставляем его как есть
			new URL(uri);
			result = uri;
		} catch (e) {
			// Если возникла ошибка, считаем путь относительным
			if (!baseURI) {
				throw `Error in base URI ${uri}! Base URI is empty.`;
			}
			const protocol = (new URL(baseURI)).protocol;
			if (protocol === 'gitlab:' || protocol === 'bitbucket:') {
				const segments = baseURI.split('@');
				if (segments.length !== 2) {
					// Не найден разделитель репозитория+ветка от файла
					throw `Error in URI ${baseURI}! Not found divider '@'`;
				}
				const basePathURL = new URL(`/${segments[1]}`, 'http://nop.none');
				const targetURL = new URL(uri, basePathURL);
				result = `${segments[0]}@${targetURL.pathname.slice(1)}${targetURL.search}${targetURL.hash}`;
			} else if (protocol === 'backend:') {
				result = new URL(uri.replace(/\.\./g, '%E2%86%90'), baseURI);
			} else {
				result = new URL(uri, baseURI);
			}
		}
		return result.toString();
	};
	this.makeURL = (uri, baseURI) => {
		let result;
		// Анализируем URI
		try {
			let url = new URL(uri);
			// Если ссылка на gitlab
			if (url.protocol === 'gitlab:') {
				let segments = url.pathname.split('@');
				if (segments.length !== 2) {
					// Не найден разделитель проекта+бранч от файла GitLab
					// eslint-disable-next-line no-debugger
					throw `Error in URI ${uri}! Not found divider '@'`;
				} else {
					let gilab_params = segments[0].split(':');
					if (gilab_params.length !== 2) {
						// Неверно указаны идентификатор проекта и бранч GitLab
						// eslint-disable-next-line no-debugger
						throw `Error in URI ${uri}! Incorrect project id and branch`;
					}

					result = {
						type: 'gitlab',
						projectID: gilab_params[0],
						url: gitlab.makeFileURI(
							gilab_params[0], // Application ID
							segments[1], // Путь к файлу
							gilab_params[1], // Бранч
							'raw'
						)
					};
				}
			} else if (url.protocol === 'bitbucket:') {
				let segments = url.pathname.split('@');
				if (segments.length !== 2) {
					//  Не найден разделитель проекта+репозиторий+бранч от файла BitBucket
					// eslint-disable-next-line no-debugger
					throw `Error in URI ${uri}! Not found divider '@'`;
				} else {
					let bitbucket_params = segments[0].split(':');
					if (bitbucket_params.length !== 3) {
						// Не верно указаны идентификаторы проекта, репозитория и бранча BitBucket
						// eslint-disable-next-line no-debugger
						throw `Error in URI ${uri}! Incorrect project id, repository id and branch`;
					}

					result = {
						type: 'bitbucket',
						projectID: bitbucket_params[0],
						repositoryID: bitbucket_params[1],
						url: bitbucket.makeFileURI(
							bitbucket_params[0], // Project ID
							bitbucket_params[1], // Repository ID
							segments[1], // Путь к файлу
							bitbucket_params[2] // Бранч
						)
					};
				}
				// В ином случае считаем, что ничего делать не нужно
			} else {
				result = {
					type: 'web',
					url
				};
			}
		} catch (e) {
			// Если возникла ошибка, считаем путь относительным
			if (!baseURI) {
				// eslint-disable-next-line no-debugger
				throw `Error in base URI ${uri}! Base URI is empty.`;
			}
			result = this.makeURL(baseURI);
			if (result.type === 'gitlab') {
				let slices = result.url.toString().split('/');
				const path = (new URL(uri, 'path:/' + slices[slices.length - 2].split('%2F').join('/'))).toString();
				slices[slices.length - 2] = (path.split('path:/')[1] || '').split('/').join('%2F');
				result.url = new URL(slices.join('/'));
			} else if (result.type === 'bitbucket') {
				const [url, params] = result.url.toString().split('?');
				const path = (new URL(uri, url)).toString();
				result.url = new URL(path + (params ? '?' + params : ''));
			} else {
				result.url = new URL(uri, result.url);
			}
		}
		return result;
	};
}

