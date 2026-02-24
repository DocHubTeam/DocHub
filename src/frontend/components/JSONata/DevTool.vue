<template>
  <v-container class="desk" grid-list-xl fluid>
    <split v-bind:direction="'vertical'">
      <split-area v-bind:size="40" class="area-space">
        <div class="console">
          <v-toolbar dense flat>
            <v-btn v-show="!autoExec" icon title="Выполнить" v-on:click="onExecute(true)">
              <v-icon>mdi-arrow-right-drop-circle</v-icon>
            </v-btn>
            <v-toolbar-title v-if="isLogFuncAvailable">
              Используйте $log(value[, tag]) для трассировки запросов.
            </v-toolbar-title>
            <v-spacer />
            <v-autocomplete
              v-if="isOriginAvailable"
              v-model="origin"
              multiple
              hide-details
              clearable
              v-bind:items="origins"
              label="origin"
              title="Базовый источник данных"
              item-text="id"
              item-value="id"
              prepend-icon="mdi-semantic-web"
              single-line>
              <template #selection="data">
                <v-chip
                  close
                  v-bind="data.attrs"
                  v-bind:input-value="data.selected"
                  v-on:click:close="() => deleteOrigin(data.item.id)">
                  {{ data.item.id }}
                </v-chip>
              </template>
            </v-autocomplete>
            <v-menu offset-y>
              <template #activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item>
                  <v-checkbox
                    v-model="autoExec" />
                  <v-list-item-title>Автовыполнение</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-toolbar>
          <editor
            ref="editor"
            v-model="query"
            class="input" />
        </div>
      </split-area>
      <split-area v-bind:size="60" class="area-space">
        <pre v-if="error" class="output" v-html="errorExplain" />
        <div v-else class="output">
          <div class="log">
            <v-data-table
              v-bind:headers="logHeaders"
              v-bind:items="logItems"
              v-bind:search="search"
              disable-pagination
              hide-default-footer
              class="elevation-1 table">
              <template #item="{ item }">
                <tr v-bind:class="item.id === selectedLog ?'selected-log':''" v-on:click="logOnClick(item)">
                  <td>{{ item.moment }}</td>
                  <td>{{ item.tag }}</td>
                </tr>
              </template>
            </v-data-table>
          </div>
          <result class="result" v-bind:jsoncode="result" />
          <!--
          <textarea v-model="result" class="result" readonly style="background-color: #f5f5f5;" wrap="off" />
          -->
        </div>
      </split-area>
    </split>
  </v-container>
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
      clayzenx <clay.zenx@gmail.com>
      Vladislav Markin <markinvy@yandex.ru>
      cu3blukekc <cu3blukekc@gmail.com>
  */

  import cookie from 'vue-cookie';
  import env from '@front/helpers/env';

  import query from '@front/manifest/query';
  import datasets from '@front/helpers/datasets';

  import editor from './JSONataEditor.vue';
  import result from './JSONResult.vue';
  import {Base64URLToUTF8} from '@front/helpers/strings';

  const COOKIE_NAME_QUERY = 'json-dev-tool-query';
  const COOKIE_NAME_AUTOEXEC = 'json-dev-tool-autoexec';

  export default {
    name: 'JSONataDevTool',
    components: {
      editor,
      result
    },
    props: {
      jsonataSource: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        isLogFuncAvailable: !env.isBackendMode(),
        query: cookie.get(COOKIE_NAME_QUERY) || '"Здесь введите JSONata запрос."',
        error: null,
        observer: null, // Таймер отложенного исполнения запросов
        search: '',
        jsonata: null,
        selectedLog: 0,
        autoExec: cookie.get(COOKIE_NAME_AUTOEXEC) === 'false' ? false : true,
        origin: null,   // Выбранный базовый источник
        origins: [],    // Список доступных источников данных
        isOriginAvailable: !env.isBackendMode(), // Определяет доступен ли выбор origin
        logHeaders: [
          {
            text: 'Таймлайн',
            align: 'start',
            value: 'moment'
          },
          {
            text: 'Тэг',
            align: 'start',
            value: 'tag'
          }
        ],
        logItems: []
      };
    },
    computed: {
      errorExplain() {
        if (this.error) {
          const pos = this.error.position;
          return `Error: ${this.error.message}\n\n${this.query.slice(0, pos)} <span style="color:red"> ${this.query.slice(pos)} </span>`;
        }
        return null;
      },
      result() {
        return this.logItems[this.selectedLog]?.value || '';
      },
      isLoading() {
        return this.$store.state.isReloading;
      }
    },
    watch: {
      origin() {
        this.onExecute();
      },
      isLoading() {
        this.doAutoExecute();
      },
      autoExec(value) {
        value && this.onExecute();
        cookie.set(COOKIE_NAME_AUTOEXEC, value, 365);
      },
      query() {
        this.onExecute();
      },
      manifest() {
        this.refreshOrigins(); // Обновляем список источников данных, если архитектурный манифест изменился
        this.loadJsonataQuery(); // Переподтягиваем при необходимости jsonata запрос из источника
      },
      jsonataSource(value) {
        this.loadJsonataQuery(value);
      }
    },
    mounted() {
      this.doAutoExecute();
      this.refreshOrigins();
      this.loadJsonataQuery();
    },
    methods: {
      deleteOrigin(originId) {
        this.origin = this.origin.filter(id => id !== originId);
      },
      clearOrigin() {
        this.origin = null;
        this.doAutoExecute();
      },
      refreshOrigins() {
        const pipe = query.expression(`([datasets.$spread().{
          "id": $keys()[0],
          "title": *.title
        }])`, null, null, true, { log: this.log});
        pipe.evaluate().then((data) => this.origins = data);
      },
      doAutoExecute() {
        if (!this.isLoading && this.autoExec) this.onExecute();
      },
      loadJsonataQuery(param_id) {
        const src = param_id || this.jsonataSource;
        if (!src) return;

        const srcSplitPos = src.search(':');
        const jType = src.substring(0, srcSplitPos);
        const jSource = src.substring(srcSplitPos + 1);

        if (jType === 'file' || jType === 'selection' || jType === 'element') {
          this.query = Base64URLToUTF8(jSource);
          this.origin = null;
          this.$refs.editor.model.setValue(this.query);
        } else if (jType === 'source') {
          this.query = `$eval(${jSource}.source)`;
          query.expression(jSource).evaluate().then((data) => {
            this.origin = data.origin;
          });
          this.$refs.editor.model.setValue(this.query);
        }
      },
      logOnClick(item) {
        this.selectedLog = item.id;
      },
      log(value, tag) {
        this.logItems.push({
          id: this.logItems.length,
          moment: (((new Date()).getTime() - this.jsonata.expOrigin?.trace?.start || 0) * 0.001).toFixed(5),
          value: value ? JSON.parse(JSON.stringify(value)) : value,
          tag
        });
        return value;
      },

      doExecute(context) {
        cookie.set(COOKIE_NAME_QUERY, this.query, 365);
        this.error = null;
        this.logItems = [];
        this.jsonata = query.expression(`(${this.query})`, null, null, true, { log: this.log});
        this.jsonata.evaluate(context).then((data) => {
          const result = JSON.stringify(data, null, 4);
          this.logItems.push({
            id: this.logItems.length,
            moment: ((this.jsonata.expOrigin?.trace?.end - this.jsonata.expOrigin?.trace?.start || 0) * 0.001).toFixed(5),
            tag: 'END',
            value: result
          });
          this.selectedLog = this.logItems.length - 1;
        }).catch((e) => this.error = e);
      },
      onExecute(force) {
        this.observer && clearTimeout(this.observer);
        if (this.autoExec || force) {
          this.observer = setTimeout(async() => {
            this.observer = null;
            if (this.origin && this.isOriginAvailable) {
              this.origin.length > 1 ?
                this.doExecute(
                  await Promise.all(this.origin.map(async(origin) => {
                    return {[ origin ]: await datasets().releaseData(`/datasets/${origin}`) };
                  })).catch((e) => this.error = e)
                )
                : this.doExecute(
                  await datasets().releaseData(`/datasets/${this.origin[0]}`)
                ).catch((e) => this.error = e);
            } else this.doExecute();
          }, force ? 10 : 500);
        }
      }
    }
  };
</script>

<style>

.desk {
  position: absolute;
  bottom: 0;
  padding: 0;
  height:100%;
  max-height: 100%;
}

.console {
  height: 100%;
}

.statistics {
  height: 24px;
  background-color: #eee;
}

.stat-item {
  color: black;
  float: left;
  font-size: 12px;
  margin-left: 12px;
  margin-top: 6px;
  margin-bottom: 6px;
}

.area-space {
  overflow: hidden;
}

.input,
.output {
  width: 100%;
  resize: none;
  padding: 0px;
  overflow: auto;
}

.output {
  height: 100%;
}

.result {
  float: right;
  width: 70%;
  height: 100%;
  padding: 4px;
  overflow: auto;
  margin: 0 !important;
  background-color: #f5f5f5;
}

.log {
  float: left;
  width: 30%;
  height: 100%;
  max-height: 100%;
  overflow: auto;
}

@media (max-width: 800px) {
  .log {
    float: none;
    width: 100%;
    height: 8em;
    overflow: auto;
  }

  .result {
    float: none;
    width: 100%;
    height: auto;
    overflow: hidden;
  }

  .log .table>tr>td {
    height: 1em;
  }
}

@media (min-width: 800px) {
  .log {
    float: left;
    width: 30%;
    height: 100%;
    max-height: 100%;
    overflow: auto;
  }

  .result {
    float: right;
    width: 70%;
    height: 100%;
    padding: 4px;
    overflow: auto;
  }
}


.log .table {
  width: 100%;
}

.input {
  height: calc(100% - 48px);
  width: 100%;
  resize: none;
  padding: 4px;
  overflow: auto;
  border: solid 1px #eee;
}

.selected-log {
  background-color: rgb(52, 149, 219) !important;
}

.console .v-select__selections {
  flex-wrap: nowrap;
  width: 270px;
  overflow-y: scroll;
}

.console .v-select__selections .v-chip {
  min-width: fit-content;
}

</style>
