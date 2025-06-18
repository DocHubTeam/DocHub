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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Vladislav Markin, Sber - 2023
  */

import axios from 'axios';

import uri from '@front/helpers/uri';
import { plantUmlCache } from '@front/helpers/cache';
import env from '@front/helpers/env';

export default {
  prepareRequest(uml) {
		switch(env.plantUmlRequestType) {
      case 'plugin':
        return window.$PAPI.renderPlantUML(uml);
      case 'post':
        return this.post(this.svgBaseURL(), uml, {
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8'
          }
        });
      case 'post_compressed':
        return this.post(this.svgBaseURL() + 'zopfli', this.compress(uml, false));
      default:
        return this.get(this.svgURL(uml));
    }
	},
  async get(umlUrl) {
    try {
      let data = await this.getCachedData(umlUrl);

      if (!data) {
        data = await axios.get(umlUrl);
        this.setCachedData(umlUrl, data);
      }

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async post(umlUrl, uml, config) {
    try {
      const cachedUrl = `${umlUrl}:${JSON.stringify(uml)}`;
      let data = await this.getCachedData(cachedUrl);

      if (!data) {
        data = await axios.post(umlUrl, uml, config);
        this.setCachedData(cachedUrl, data);
      }

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async getCachedData(umlUrl) {
    if (env.cache) {
      const cachedData = await plantUmlCache.get(umlUrl);

      if (cachedData) {
        return cachedData;
      }
    }
  },
  setCachedData(umlUrl, data) {
    if (env.cache) {
      plantUmlCache.set(umlUrl, data);
    }
  },
	svgURL(uml) {
		return this.svgBaseURL() + this.compress(uml);
	},
	svgBaseURL() {
		return !uri.isURL(env.plantUmlServer)
			? `${window?.location?.protocol || 'https:'}//${env.plantUmlServer}`
			: env.plantUmlServer;
	},
	encode64_(e) {
		let r, i;
		for (r = '', i = 0; i < e.length; i += 3)
			i + 2 == e.length ? r += this.append3bytes(e[i], e[i + 1], 0) : i + 1 == e.length ? r += this.append3bytes(e[i], 0, 0) : r += this.append3bytes(e[i], e[i + 1], e[i + 2]);
		return r;
	},
	append3bytes(e, n, t) {
		let c1, c2, c3, c4, r;
		return c1 = e >> 2,
		c2 = (3 & e) << 4 | n >> 4,
		c3 = (15 & n) << 2 | t >> 6,
		c4 = 63 & t,
		r = '',
		r += this.encode6bit(63 & c1),
		r += this.encode6bit(63 & c2),
		r += this.encode6bit(63 & c3),
		r += this.encode6bit(63 & c4),
		r;
	},
	encode6bit(e) {
		return e < 10 ? String.fromCharCode(48 + e) : (e -= 10) < 26 ? String.fromCharCode(65 + e) : (e -= 26) < 26 ? String.fromCharCode(97 + e) : 0 == (e -= 26) ? '-' : 1 == e ? '_' : '?';
	},
	compress(s, toEncode = true) {
		s = unescape(encodeURIComponent(s));
		let arr = [];
		for (var i = 0; i < s.length; i++) {
			arr.push(s.charCodeAt(i));
		}
		// eslint-disable-next-line no-undef
		let compressor = new Zopfli.RawDeflate(arr);
		let compressed = compressor.compress();

		return toEncode ? this.encode64_(compressed) : compressed;
	}
};
