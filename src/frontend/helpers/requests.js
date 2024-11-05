  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2022 Sber

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
      R.Piontik <r.piontik@mail.ru> - 2021
      Vladislav Markin, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
      Vladislav Markin, Sber - 2023
      Vladislav Markin, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2024

  */

import axios from 'axios';
import YAML from 'yaml';
import crc16 from '@global/helpers/crc16';
import gitlab from '@front/helpers/gitlab';
import uriTool from '@front/helpers/uri';
import { Buffer } from 'buffer';
import xml from '@global/helpers/xmlparser';

import env, { Plugins } from './env';
import { responseCacheInterceptor, requestCacheInterceptor } from './cache';
import oidcClient from '@front/auth/oidc-client';
// import uriTool from '@/helpers/uri';


// CRC16 URL задействованных файлов
const tracers = {};

// Add a request interceptor

const responseErrorInterceptor = (error) => {
	if (error.response?.status === 304) {
		if (error.config.lastCachedResult) {
			return {
				...error.response,
				data: error.config.lastCachedResult.data
			};
		}
	}

	return Promise.reject(error);
};

// Интерцептор для GitLab авторизации
axios.interceptors.request.use(async(params) => {
	if (env.cache) {
		await requestCacheInterceptor(params);
	}
  if (env.backendURL() && (new URL(params.url)).host === (new URL(env.backendURL())).host) {
    const accessToken = await oidcClient.getAccessToken();
    params.headers.common.Authorization = 'Bearer ' + accessToken;
  }
	return gitlab.axiosInterceptor(params);
}, (error) => Promise.reject(error));

// Здесь разбираемся, что к нам вернулось из запроса и преобразуем к формату внутренних данных
axios.interceptors.response.use(async(response) => {
	if (response.config.responseHook)
		response.config.responseHook(response);
	if (typeof response.data === 'string') {
		if (!response.config.raw) {
			const url = (response.config.url || '').toString().split('?')[0].toLowerCase();
			if (
				(url.indexOf('.json/raw') >= 0)
				|| (url.endsWith('.json'))
				|| (response?.headers || {})['content-type'] === 'application/json'
				)
				response.data = JSON.parse(response.data);
			else if (
				(url.indexOf('.yaml/raw') >= 0)
				|| (url.endsWith('.yaml'))
				|| (response?.headers || {})['content-type'] === 'application/x-yaml')
				response.data = YAML.parse(response.data);
			else if (
				(url.indexOf('.xml/raw') >= 0)
				|| (url.endsWith('.xml'))
				|| (response?.headers || {})['content-type'] === 'application/xml')
				response.data = xml.parse(response.data);
		}
	}

	if (env.cache) {
		const reRequest = await responseCacheInterceptor(response);

		if (reRequest) {
			return axios(reRequest);
		}
	}

	return response;
}, responseErrorInterceptor);


function injectPAPIMiddleware() {
	if (window.$PAPI && !window.$PAPI.middleware) {
		window.$PAPI.middleware = function(response, request) {
			if (!response) return response;
			let type = response.contentType;
			switch (type) {
				case 'yaml': response.data = YAML.parse(response.data); break;
				case 'json': response.data = JSON.parse(response.data); break;
				case 'xml': !request.raw && (response.data = xml.parse(response.data)); break;
				case 'jpg':
					type = 'jpeg';
				// eslint-disable-next-line no-fallthrough
				case 'jpeg':
				case 'png':
				case 'svg':
					if (type === 'svg') type = 'svg+xml';
					response.data = Buffer.from(response.data, 'base64');
					response.headers = Object.assign(response.headers || {}, {
						'content-type': `image/${type}`
					});
					break;
			}
			return response;
		};
	}
}

export default {
	axios,
	getSourceRoot() {
		if (env.isPlugin(Plugins.idea)) {
			return 'plugin:/idea/source/';
		} else {
			return window.origin + '/';
		}
	},

	// Возвращает "чистый" URL пригодный для индексирования
	getIndexURL(url) {
		return url.toString().split('?')[0].split('#')[0];
	},

	// Возвращает CRC ссылки
	crcOfURL(url) {
		return crc16(this.getIndexURL(url));
	},

	// Фиксируются все обращения для построения карты задействованных ресурсов
	trace(url) {
		env.isPlugin() && (tracers[this.crcOfURL(url)] = Date.now());
	},

	// Возвращает время последнего обращения к ресурсу
	isUsedURL(url) {
		return tracers[this.crcOfURL(url)];
	},

	// Транслирует ссылки на backend в прямые URL
	translateBackendURL(url) {
		const finalURl = url && url.toString();
		if (finalURl && finalURl.startsWith('backend://')) {
			try {
				return (new URL(finalURl.slice(10), env.backendFileStorageURL()));
			} catch (e) {
				throw new Error(e);
			}
		} else {
			return url;
		}
	},

	encodeRelPath(path) {
		if (!env.isBackendMode()) return path;
		const struct = path.split('?');
		struct[0] = struct[0].replace(/\.\./g, '%E2%86%90');
		return struct.join('?');
	},

	expandResourceURI(URI) {
		const url = new URL(URI);
		const objectPath = url.pathname.slice(1);
		const subPath = this.encodeRelPath(url.hash.slice(1));
		const result = uriTool.makeURL(uriTool.makeURIByBaseURI(subPath, uriTool.getBaseURIOfPath(objectPath))).url;
		return result.toString();
	},

	// axios_params - параметры передаваемые в axios
	// 		responseHook - содержит функцию обработки ответа перед работой interceptors
	//		raw - если true возвращает ответ без обработки
	request(uri, baseURI, axios_params) {
		const params = Object.assign({}, axios_params);
		params.url = uri;
		// Если ссылка ведет на backend конвертируем ее
		let strURI = (uri || '').toString();

		// Если URI является ссылкой на ресурс в Data Lake интерпретируем ее
		strURI.startsWith('res://') && (strURI = this.expandResourceURI(strURI));
		baseURI && baseURI.toString().startsWith('res://') && (baseURI = this.expandResourceURI(baseURI));

		if (strURI.startsWith('source:')) {
			return new Promise((success) => {
				success({
					data: JSON.parse(decodeURIComponent((new URL(uri)).pathname))
				});
			});
		} else if (strURI.startsWith('backend://')) {
			const structURI = strURI.split('/');
			const origin = `${structURI[0]}//${structURI[2]}/`;
			const path = this.encodeRelPath(strURI.slice(origin.length));
			params.url = new URL(path, this.translateBackendURL(origin));
		} else if ((baseURI || '').toString().startsWith('backend://')) {
			params.url = new URL(this.encodeRelPath(uri.toString()), this.translateBackendURL(baseURI));
		} else if (baseURI) {
			params.url = uriTool.makeURL(uriTool.makeURIByBaseURI(strURI, baseURI)).url;
		} else {
			params.url = uriTool.makeURL(strURI).url;
		}

		if (
			env.isPlugin(Plugins.idea) && params.url.toString().startsWith('plugin:') ||
			env.isPlugin(Plugins.vscode) && params.url.toString().startsWith('https://file+.vscode-resource.vscode-cdn.net') && !params.responseHook
		) {
			injectPAPIMiddleware();
			this.trace(params.url);
			params.raw = !!axios_params?.raw;
			return window.$PAPI.request(params);
		} else {
			return axios(params);
		}
	}
};
