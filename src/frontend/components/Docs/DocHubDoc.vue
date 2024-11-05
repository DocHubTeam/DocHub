<template>
  <div>
    <v-alert v-if="!isReloading && error" icon="error" type="error">
      <h2>Ошибка!</h2>
      <div>Расположение: {{ path }}</div>
      <div>{{ error }}</div>
    </v-alert>
    <template v-if="!isReloading && !error">
      <component
        v-bind:is="is"
        v-if="is"
        v-bind:inline="inline"
        v-bind:params="currentParams"
        v-bind:profile="profile"
        v-bind:path="currentPath"
        v-bind:get-content="getContentForPlugin"
        v-bind:put-content="putContentForPlugin"
        v-bind:to-print="isPrintVersion"
        v-bind:event-bus="eventBus"
        v-bind:pull-data="pullData"
        v-bind:context-menu="contextMenu" />
      <template v-else>
        <v-alert v-if="profile && !isReloading" icon="warning">
          Неизвестный тип документа [{{ docType }}]<br>
          Path: {{ currentPath }}<br>
          Params: {{ currentParams }}<br>
          Profile: <br>
          <pre>
            {{ JSON.stringify(profile, null, 2) }}
          </pre>
        </v-alert>
        <spinner v-else />
      </template>
    </template>
  </div>
</template>

<script>
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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
  */


  import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';
  import AsyncApiComponent from '@front/components/Docs/DocAsyncApi.vue';
  import Empty from '@front/components/Controls/Empty.vue';
  import requests from '@front/helpers/requests';
  import datasets from '@front/helpers/datasets';
  import query from '@front/manifest/query';
  import uriTool from '@front/helpers/uri';
  import env from '@front/helpers/env';

  import Swagger from './DocSwagger.vue';
  import Plantuml from './DocPlantUML.vue';
  import DocMarkdown from './DocMarkdown.vue';
  import DocTable from './DocTable.vue';
  import DocMermaid from './DocMermaid.vue';
  import DocNetwork from './DocNetwork.vue';
  import DocSmartants from './DocSmartAnts.vue';
  import Spinner from '@front/components/Controls/Spinner.vue';

  // Встроенные типы документов
  const inbuiltTypes = {
    [DocTypes.ASYNCAPI]: 'async-api-component',
    [DocTypes.OPENAPI]: 'swagger',
    [DocTypes.PLANTUML]: 'plantuml',
    [DocTypes.MARKDOWN]: 'doc-markdown',
    [DocTypes.TABLE]: 'doc-table',
    [DocTypes.MERMAID]: 'doc-mermaid',
    [DocTypes.NETWORK]: 'doc-network',
    [DocTypes.SMARTANTS]: 'doc-smartants'
  };


  export default {
    name: 'DocHubDoc',
    components: {
      AsyncApiComponent,
      Plantuml,
      Swagger,
      DocMarkdown,
      DocTable,
      Empty,
      DocMermaid,
      DocNetwork,
      DocSmartants,
      Spinner
    },
    props: {
      path: {
        type: String,
        default: '$URL$'
      },
      inline: { type: Boolean, default: false },
      // Параметры передающиеся в запросы документа
      // Если undefined - берутся из URL
      params: {
        type: Object,
        default: undefined
      },
      contextMenu: {
        type: Array,
        default() {
          return [];
        }
      }
    },
    data() {
      return {
        DocTypes,
        refresher: null,
        profile: null,
        error: null,
        currentPath : this.resolvePath(),
        currentParams: this.resolveParams(),
        dataProvider: datasets()
      };
    },
    computed: {
      eventBus() {
        return window.EventBus;
      },
      is() {
        return inbuiltTypes[this.docType]
          || (this.$store.state.plugins.documents[this.docType] && `plugin-doc-${this.docType}`)
          || null;
      },
      docType() {
        return (this.profile?.type || 'unknown').toLowerCase();
      },
      baseURI() {
        return uriTool.getBaseURIOfPath(this.currentPath);
      },
      isReloadingManifest() {
        return this.$store.state.isReloading;
      },
      isReloading() {
        return this.isReloadingManifest || !!this.refresher;
      },
      isPrintVersion() {
        return this.$store.state.isPrintVersion;
      },
      putContentForPlugin() {
        return env.isPlugin() ? (url, content) => {return new Promise((success, reject) => {
          const fullPath = uriTool.makeURIByBaseURI(url, this.baseURI);
          window.$PAPI.pushFile(fullPath, content)
            .then(success)
            .catch(reject);
        });} : null;
      }
    },
    watch: {
      '$route'() {
        this.refresh();
      },
      params() {
        this.refresh();
      },
      isReloadingManifest() {
        this.refresh();
      }
    },
    mounted() {
      this.refresh();
    },
    methods: {
      pullProfileFromResource(uri) {
        requests.request(uri).then((response) => {
          const contentType = (response?.headers['content-type'] || '').split(';')[0].split('/')[1];
          this.profile = {
            type: contentType,
            source: `source:${encodeURIComponent(JSON.stringify(response.data))}`
          };
        }).finally(() => {
          this.refresher = null;
        });
      },
      // Достаем данные профиля документа из DataLake
      pullProfileFromDataLake(dateLakeId) {
        query.expression( query.getObject(dateLakeId), null, this.resolveParams())
          .evaluate()
          .then((profile) => {
            this.profile = Object.assign({ $base: this.path }, profile);
          })
          .catch((e) => {
            this.error = e.message;
          })
          .finally(() => {
            this.currentPath = this.resolvePath();
            this.currentParams = this.resolveParams();
            this.refresher = null;
          });
      },
      // Обновляем контент документа
      refresh() {
        if (this.refresher) clearTimeout(this.refresher);
        this.refresher = setTimeout(() => {
          this.profile = null;
          const path = this.resolvePath().slice(1).split('/');
          if (path[1].startsWith('blob:') || (path[1].slice(-1) === ':')) {
            this.pullProfileFromResource(path.slice(1).join('/'));
          } else {
            this.pullProfileFromDataLake(`"${path.join('"."')}"`);
          }
        }, 50);
      },
      resolveParams() {
        return this.params || this.$router.currentRoute.query || {};
      },
      // Определяем текущий путь к профилю документа
      resolvePath() {
        if (this.path === '$URL$') return this.$router.history.current.path;
        return this.profile?.$base || this.path;
      },
      // Провайдер контента файлов для плагинов
      //  url - прямой или относительный URL к файлу
      getContentForPlugin(url) {
        return new Promise((success, reject) => {
          const whiter = setInterval(() => {
            if (!this.isReloading) {
              requests.request(url, this.baseURI, { raw : true })
                .then(success)
                .catch(reject);
              clearInterval(whiter);
            }
          }, 50);
        });
      },
      // API к озеру данных архитектуры
      //  expression - JSONata запрос или идентификатор ресурса
      //  self - значение переменной $self в запросе
      //  params - значение переменной $params в запросе
      //  context - контекст запроса (по умолчанию равен manifest)
      pullData(expression, self_, params, context) {
        if (!expression) {
          return this.dataProvider.releaseData(this.resolvePath(), params || this.params);
        } else
          return this.dataProvider.getData(context, { source: expression }, params);
      }
    }
  };
</script>
