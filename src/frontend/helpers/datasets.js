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

import requests from './requests';
import query from '../manifest/query';
import source from '../../global/datasets/source.mjs';
import datasetDriver from '@global/datasets/driver.mjs';
import pathTool from '@global/manifest/tools/path.mjs';
import env from '@front/helpers/env';
import compress from '@global/compress/compress.mjs';

// export const dependencyOf = {};

const compressor = compress({
  // eslint-disable-next-line no-undef
  DecompressionStream,
  // eslint-disable-next-line no-undef
  CompressionStream
});

export default function() {
  return Object.assign({
    parentParseSource: datasetDriver.parseSource
  }, datasetDriver,
    {
      // Дефолтный метод получения объекта данных
      dsResolver(datasetID) {
        const state = window.Vuex.state;
        return {
          // Обогащаем профиль информацией об идентификаторе
          subject: Object.assign({ _id: datasetID }, (state.manifest.datasets || {})[datasetID]),
          baseURI: state.sources[`/datasets/${datasetID}`][0]
        };
      },
      pathResolver(path) {
        if (env.isBackendMode())
          throw `pathResolver is not correct call for backend mode ... [${path}]`;
        const state = window.Vuex.state;
        return {
          context: state.manifest,
          subject: pathTool.get(state.manifest, path),
          baseURI: (state.sources[path] || ['/'])[0]
        };
      },
      // Драйвер запросов к ресурсам
      request(url, baseURI) {
        return requests.request(url, baseURI);
      },
      // Драйвер запросов JSONata
      jsonataDriver: query,
      async parseSource(context, data, subject, params, baseURI, dependency) {
        const sourceType = source.type(data);
        if (sourceType === 'id') {
          const dependencyOf = window.Vuex.state.dependencyOf;
          if (dependency) {
            const filename = window.Vuex.state.manifest.datasets[data].__uri__;
            if (!dependencyOf[filename]) dependencyOf[filename] = new Set();
            dependencyOf[filename].add(dependency);
          }

          const filename = window.Vuex.state.manifest.datasets[data].__uri__;
          if (!dependencyOf[filename]) dependencyOf[filename] = new Set();
          dependencyOf[filename].add(data);

          const args = { context, data, subject, params, baseURI };
          if (env.isPlugin())
            return await window.$PAPI.pullFromCache(`{"path":"/datasets/${data}"}`, async() => {
              return await this.parentParseSource(context, data, subject, params, baseURI);
            }, args);
          else return await this.parentParseSource(context, data, subject, params, baseURI);

        } else {
          return await this.parentParseSource(context, data, subject, params, baseURI);
        }
      },
      // Переопределяем метод получения данных для работы с бэком
      getDataOriginal: datasetDriver.getData,
      async getData(context, subject, params, baseURI) {
        if (env.isBackendMode()) {
          //todo: Нужно разобраться с первопричиной, почему передаётся объект целиком
          // subject.source = `$backend/${md5(subject.source)}`;
          // const query = encodeURIComponent(JSON.stringify(subject));
          const query = encodeURIComponent(await compressor.encodeBase64(JSON.stringify(subject)));
          const url = new URL(`backend://release-data-profile/${query}`);
          url.searchParams.set('params', JSON.stringify(params || null));
          url.searchParams.set('baseuri', baseURI);
          return (await requests.request(url)).data;
        } else return await this.getDataOriginal(context, subject, params, baseURI);
      },
      getReleaseData: datasetDriver.releaseData,
      async releaseData(path, params) {
        if (env.isBackendMode()) {
          let url = `backend://release-data-profile/${encodeURIComponent(path)}`;
          url += `?params=${encodeURIComponent(JSON.stringify(params || null))}`;
          return (await requests.request(url)).data;
        } else return await this.getReleaseData(path, params);
      }
    });
}
