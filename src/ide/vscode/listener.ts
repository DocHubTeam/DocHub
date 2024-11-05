  /*
  Copyright (C) 2023 Sber
  Copyright (C) 2023 Roman Piontik R.Piontik@mail.ru

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Navasardyan Suren, Sber

  Contributors:
      Navasardyan Suren, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
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
        const data = normalizeResponse(type, value);

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
