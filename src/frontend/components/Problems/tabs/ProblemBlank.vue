<template>
  <v-card class="card-item" xs12 md12>
    <v-card-text v-if="!problem.content">
      Отклонение [{{ subject }}] не обнаружено. Вероятно оно устранено...
    </v-card-text>
    <template v-else>
      <v-card-title>
        <v-icon v-if="problem.exception" left style="color:#FF6F00" title="На отклонение определено исключение">warning</v-icon>
        <v-icon v-else left style="color:#f00">error</v-icon>
        <span class="title">Сводка</span>
      </v-card-title>
      <v-card-text class="headline font-weight-bold">
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-subtitle>Идентификатор отклонения</v-list-item-subtitle>
              <v-list-item-title>
                {{ subject }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <template v-if="problem.content">
            <v-list-item v-if="problem.content.location">
              <v-list-item-content>
                <v-list-item-subtitle>Ссылка на объект</v-list-item-subtitle>
                <v-list-item-title>
                  <router-link v-bind:to="problem.content.location">{{ problem.content.location }}</router-link>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="problem.content.correction">
              <v-list-item-content>
                <v-list-item-subtitle>Как исправить</v-list-item-subtitle>
                <v-list-item-title>
                  <pre>{{ problem.content.correction }}</pre>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="problem.content.description">
              <v-list-item-content>
                <v-list-item-subtitle>Описание проблемы</v-list-item-subtitle>
                <v-list-item-title>
                  <pre>{{ problem.content.description }}</pre>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="problem.content.standard">
              <v-list-item-content>
                <v-list-item-subtitle>Стандарт</v-list-item-subtitle>
                <v-list-item-title>
                  <router-link v-if="!isExternalURI(problem.content.standard)" v-bind:to="problem.content.standard">
                    {{ problem.content.standard }}
                  </router-link>
                  <a v-else v-bind:href="problem.content.standard">{{ problem.content.standard }}</a>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <template v-if="problem.exception">
              <v-divider />
              <v-list-item v-if="problem.exception.reason">
                <v-list-item-content>
                  <v-list-item-title>
                    Исключение
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item v-if="problem.exception.reason">
                <v-list-item-content>
                  <v-list-item-subtitle>Причина исключения</v-list-item-subtitle>
                  <v-list-item-title>
                    <pre>{{ problem.exception.reason }}</pre>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item v-if="problem.exception.cause">
                <v-list-item-content>
                  <v-list-item-subtitle>Документ-основание</v-list-item-subtitle>
                  <v-list-item-title>
                    <router-link v-if="!isExternalURI(problem.exception.cause)" v-bind:to="problem.exception.cause">
                      {{ problem.exception.cause }}
                    </router-link>
                    <a v-else v-bind:href="problem.exception.cause">{{ problem.exception.cause }}</a>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </template>
        </v-list>
      </v-card-text>
    </template>
  </v-card>
</template>

<script>
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
      R.Piontik <r.piontik@mail.ru> - 2022
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Navasardyan Suren, Sber - 2023
      Vladislav Markin, Sber - 2023
  */

  import uri from '@front/helpers/uri';

  import Mixin from '../mixin';

  export default {
    name: 'Validators',
    mixins: [Mixin],
    props: {
      subject: { type: String, default: '' }
    },
    data() {
      return {};
    },
    computed: {
      problem() {
        let content = null;
        let validator = null;
        for(let i = 0; i < this.problems.length && !content; i++ ) {
          validator = this.problems[i];
          content = (validator.items || []).find((problem) => (problem || {}).uid === this.subject);
        }
        return {
          content,
          validator,
          exception: content?.exception
        };
      }
    },
    methods: {
      isExternalURI: (url) => uri.isExternalURI(url)
    }
  };
</script>

<style scoped>
  .card-item {
    width: 100%;
    margin-top: 12px;
  }

  pre {
    white-space: pre-wrap;
  }
</style>
