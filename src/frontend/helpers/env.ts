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
      R.Piontik <r.piontik@mail.ru> - 2022
      Vladislav Markin, Sber - 2022
      Navasardyan Suren, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Navasardyan Suren, Sber - 2023
      Vladislav Nefedov, Sber - 2023
      Vladislav Markin, Sber - 2023
      Nikolay Temnyakov, Sber - 2024
  */

import consts from '@front/consts';

export type TCacheMethods = 'GET' | 'HEAD';
export type TEnvValue = string | undefined;
export type TProcessEnvValues = { [key: string | symbol]: TEnvValue };

export enum Plugins {
  idea = 'idea',
  vscode = 'vscode'
}

export enum CACHE_LEVEL {
  low = 1,
  high = 2
}

const ENV_ERROR_TAG = '[env.dochub]';

const DEF_METAMODEL_URI_PORTAL = '/metamodel/root.yaml';
const DEF_METAMODEL_URI_IDEA = 'plugin:/idea/metamodel/root.yaml';

export default {
  dochub: <TProcessEnvValues>{},
  isPlugin(plugin?: Plugins): boolean {
    const isIdea = !!window.DocHubIDEACodeExt;
    const isVsCode = !!window.DochubVsCodeExt;

    switch (plugin) {
      case Plugins.idea: {
        return isIdea;
      }
      case Plugins.vscode: {
        return isVsCode;
      }
      default: {
        return isIdea || isVsCode;
      }
    }
  },
  // Адрес backend сервере
  backendURL(): string {
    return this.dochub?.VUE_APP_DOCHUB_BACKEND_URL || (window?.origin && (window?.origin !== 'null') ? window?.origin : 'http://localhost:3030/');
  },
  // Адрес API доступа к файлам backend сервера
  backendFileStorageURL(): string {
    return (new URL('/core/storage/', this.backendURL())).toString();
  },
  isBackendMode() {
    return !this.isPlugin() && (process.env.VUE_APP_DOCHUB_BACKEND_URL || ((process.env.VUE_APP_DOCHUB_MODE || '').toLowerCase() === 'backend'));
  },
  isRolesMode(): boolean {
    return (process.env.VUE_APP_DOCHUB_ROLES_MODEL || 'N').toUpperCase() === 'Y';
  },
  isProduction(): boolean {
    return this.dochub.NODE_ENV === 'production';
  },
  isTraceJSONata(): boolean {
    return (this.dochub.VUE_APP_DOCHUB_JSONATA_ANALYZER || 'N').toUpperCase() === 'Y';
  },
  cacheWithPriority(priority: CACHE_LEVEL): boolean {
    const systemSetting = +this.dochub.VUE_APP_DOCHUB_CACHE_LEVEL;

    if (systemSetting in CACHE_LEVEL) {
      if (this.cache) {
        return systemSetting === priority;
      }
    } else if (systemSetting) {
      // eslint-disable-next-line no-console
      console.error(`Неправильно указан параметр "VUE_APP_DOCHUB_CACHE_LEVEL=${systemSetting}" в env!`, ENV_ERROR_TAG);
    }

    return false;
  },
  get cache(): TCacheMethods | null {
    const currentMethod = (this.dochub.VUE_APP_DOCHUB_CACHE || 'NONE').toUpperCase();

    if (currentMethod === 'NONE') {
      return null;
    }

    if (['GET', 'HEAD'].includes(currentMethod)) {
      return currentMethod as TCacheMethods;
    }

    throw new Error(`Неправильно указан параметр "VUE_APP_DOCHUB_CACHE=${currentMethod}" в env!`);
  },
  get ideSettings() {
    return (window.DocHubIDEACodeExt || window.DochubVsCodeExt)?.settings;
  },
  get rootDocument(): TEnvValue {
    return this.dochub.VUE_APP_DOCHUB_ROOT_DOCUMENT;
  },
  get rootManifest(): TEnvValue {
    if (this.isPlugin(Plugins.idea)) {
      return consts.plugin.ROOT_MANIFEST;
    } else if (this.isPlugin(Plugins.vscode)) {
      return window.DochubVsCodeExt.rootManifest;
    } else return this.dochub.VUE_APP_DOCHUB_ROOT_MANIFEST;
  },
  get renderCore(): TEnvValue {
    return this.ideSettings?.render?.mode || this.dochub.VUE_APP_DOCHUB_RENDER_CORE || 'graphviz';
  },
  // Переменные систем управления версиями
  get gitlabUrl(): TEnvValue {
    return this.ideSettings?.env?.DOCHUB_IDE_GITLAB_URL || this.dochub.VUE_APP_DOCHUB_GITLAB_URL;
  },
  get bitbucketUrl(): TEnvValue {
    return this.ideSettings?.env?.DOCHUB_IDE_BITBUCKET_URL || this.dochub.VUE_APP_DOCHUB_BITBUCKET_URL;
  },
  get personalToken(): TEnvValue {
    return this.ideSettings?.env?.DOCHUB_IDE_PERSONAL_TOKEN || this.dochub.VUE_APP_DOCHUB_PERSONAL_TOKEN;
  },
  //
  get appendDocHubDocs(): TEnvValue {
    return this.dochub.VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS;
  },
  get appId(): TEnvValue {
    return this.dochub.VUE_APP_DOCHUB_APP_ID;
  },
  get clientSecret(): TEnvValue {
    return this.dochub.VUE_APP_DOCHUB_CLIENT_SECRET;
  },
  // Определяет сервер рендеринга
  get plantUmlServer(): TEnvValue {
    const envValue = this.dochub.VUE_APP_PLANTUML_SERVER || consts.plantuml.DEFAULT_SERVER;
    if (this.isPlugin(Plugins.idea)) {
      return this.ideSettings?.isEnterprise ? envValue : (
        this.ideSettings?.render?.external ? this.ideSettings?.render?.server : null
      );
    } else if (this.isPlugin(Plugins.vscode)) {
      return this.ideSettings?.render.server;
    } else return envValue;
  },
  // Определяет тип запроса к серверу рендеринга
  get plantUmlRequestType(): TEnvValue {
    if (!this.ideSettings?.isEnterprise) {
      if (this.isPlugin(Plugins.idea)) {
        return this.ideSettings?.render?.external ? this.ideSettings?.render?.request_type || 'get' : 'plugin';
      } else if (this.isPlugin(Plugins.vscode)) {
        return this.ideSettings?.render?.request_type || 'get';
      }
    }

    const requestType = this.dochub.VUE_APP_PLANTUML_REQUEST_TYPE?.toLowerCase() || 'get';

    if (['get', 'post', 'post_compressed'].includes(requestType)) {
      return requestType as TCacheMethods;
    }
    throw new Error(`Неправильно указан параметр "VUE_APP_PLANTUML_REQUEST_TYPE=${requestType}" в env!`);
  },
  get isAppendDocHubDocs(): boolean {
    return (this.appendDocHubDocs || 'y').toLowerCase() === 'y';
  },
  get uriMetamodel(): string {
    let result = this.dochub.VUE_APP_DOCHUB_METAMODEL || DEF_METAMODEL_URI_PORTAL;
    let host = window.location.toString();
    if (this.isPlugin(Plugins.idea)) {
      result = this.ideSettings?.isEnterprise ? result : DEF_METAMODEL_URI_IDEA;
    } else if (this.isPlugin(Plugins.vscode)) {
      if (!this.ideSettings?.isEnterprise && window.DochubVsCodeExt?.metamodelUri) {
        const { scheme, path, authority } = window.DochubVsCodeExt?.metamodelUri;

        result = `${path}`;
        host = `${scheme}://${authority}`;
      } else host = this.ideSettings?.enterpriseServer;
    }
    result = (new URL(result, host)).toString();
    // eslint-disable-next-line no-console
    console.info('Source of metamodel is ', result);
    return result;
  }
};
