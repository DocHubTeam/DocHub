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
  */

import { Store } from 'vuex';
import YAML from 'yaml';
import { listeners } from './pipe';
import config from '@front/config';
import { Buffer } from 'buffer';
import router from '@front/router';
import { Route } from 'vue-router';

enum Files {
  'jpg',
  'jpeg',
  'png',
  'svg',
  'yaml',
  'json',
  'plantuml'
}

type TFiles = keyof typeof Files;

type TEvent = {
  data?: {
    command?: string,
    content?: {
      url?: string,
      uri?: string,
      stringifedUri?: string,
      type?: TFiles,
      uuid?: string,
      value?: string,
      node?: any,
      route: Route
    },
    error?: any
  }
}

const getContentType = (type: TFiles): string => {
  if (type === 'svg') {
    return 'image/svg+xml';
  }

  if (['jpg', 'jpeg', 'png'].includes(type)) {
    return `image/${type}`;
  }

  return '';
};

const normalizeResponse = (type: TFiles, content: string): any => {
  if (['jpg', 'jpeg', 'png', 'svg'].includes(type)) {
    return Buffer.from(content, 'base64');
  }

  if (type === 'yaml') {
    return YAML.parse(content);
  }

  if (type === 'json') {
    return JSON.parse(content);
  }

  if (type === 'plantuml') {
    return content;
  }

  return content;
};

export default (store: Store<any>): void => {
  window.addEventListener('message', (event: TEvent) => {
    const {command, content, error} = event?.data;

    if(command === 'changeFile') {
      const datasetsIDs = [...(window as any).Vuex.state.dependencyOf[content.uri]];

      if(datasetsIDs && Array.isArray(datasetsIDs)) {
        window.$PAPI.clearDatasetsCache(datasetsIDs);
      }
    }

    if(command === 'fetchPlugins') {
      const plugins = require('../../../plugins.json');
      window.$PAPI.pluginList({ plugins: plugins.inbuilt });
    }

    if(command === 'goToRoute') {
      (window as any).Router.push(content.route);
    }
    if(command === 'refresh') {
      // Костыль. router.go(0) не работает
      router.go(-1);
      setTimeout(() => router.go(1), 1);
    }
    if(command === 'checkIsEntity') {
      if(store.state.manifest.entities[content.node.name])
        window.$PAPI.addLinks(content.node);
    }
    if (command === 'navigate') {
      (window as any).Router.push('/');
      (window as any).Router.push(content.url);
    }
    if(command === 'refresh') {
      // Костыль. router.go(0) не работает
      router.go(-1);
      setTimeout(() => router.go(1), 1);
    }

    if (command === 'response') {
      const {value, type, uuid} = content;

      if (error) {
        listeners[uuid].rej(error);
      }

      try {
        let data = normalizeResponse(type, value);

        const { resolver, args, res } = listeners[uuid]
        if (data.hasCache) {
          // Если кэш есть - отдаем его
          res(JSON.parse(data.cache))
          return;
        } else if(!data.hasCache && listeners[uuid].resolver) {
          // Если нет - Получаем его из резолвера и аргументов
          const key = data.key
          resolver(...Object.entries(args)).then((data: any) => {
            // Вызываем updateCache и отдаем данные
            window.$PAPI.updateCache(key, data)
            res(data);
          });
          return;
        } else
        listeners[uuid].res({
          data,
          headers: {
            'content-type': getContentType(type)
          }
        });
      } catch (e) {
        listeners[uuid].rej(e);
      } finally {
        delete listeners[uuid];
      }
    }

    if (command === 'has-root-manifest') {
      const {uri} = content;

      if (uri === null) {
        window.DochubVsCodeExt.rootManifest = null;
        // config.root_manifest = null;
        store.commit('setNoInited', true);
      } else {
        window.DochubVsCodeExt.rootManifest = uri;
        // config.root_manifest = uri;
        store.dispatch('reloadAll');
      }
    }
  });
};
