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


import { v4 as uuidv4 } from 'uuid';

import plantuml from '@front/helpers/plantuml';
import config from '@front/config';

const emit = (command: string, content: any): Promise<any> | void =>
  vscode.postMessage({command, content});

export const listeners: { [key: string]: any } = {};

export default (): void => {
  window.$PAPI = {
    settings: window.DochubVsCodeExt.settings,
    checkIsRootManifest(): void {
      emit('check-is-root-manifest', '');
    },
    pluginList(plugins) {
      emit('pluginList', plugins);
    },
    loaded() {
      emit('loaded', '');
    },
    initProject(mode): void {
      emit('create', mode);
    },
    addLinks(node): void {
      emit('addLinks', node);
    },
    applyEntitiesSchema(schema) {
      emit('applyschema', JSON.stringify({ schema }));
    },
    debug() {
      emit('debug', undefined);
    },
    download(content, title, description): void {
      const stringifedUri = JSON.stringify({
        content, title, description
      });

      emit('download', stringifedUri);
    },
    goto(source, entity, id): void {
      emit('goto', JSON.stringify({ source, entity, id }));
    },
    reload(currentRoute): void {
      emit('reload-force', { currentRoute });
    },
    renderPlantUML(uml): Promise<void> {
      const stringifedUri = JSON.stringify(plantuml.svgURL(uml));
      const uuid = uuidv4();

      emit('plantuml', {
        stringifedUri,
        uuid
      });

      return new Promise((res, rej): void => {
        listeners[uuid] = { res, rej };
      });
    },
    request(uri): Promise<void> {
      const stringifedUri = JSON.stringify(uri);
      const uuid = uuidv4();

      emit('request', {
        stringifedUri,
        uuid
      });

      return new Promise((res, rej): void => {
        listeners[uuid] = { res, rej };
      });
    }
  };
};
