<template>
  <v-toolbar v-if="!isPrintVersion" class="toolbar" rounded elevation="0" color="#fff" density="compact">
    <v-btn icon title="Экспорт в Excalidraw" v-on:click="$emit('exportToExcalidraw')">
      <v-icon>mdi-download</v-icon>
    </v-btn>
    <v-btn v-if="selectedNodes" icon title="Кадрировать" v-on:click="$emit('doFocus')">
      <v-icon>mdi-crop-free</v-icon>
    </v-btn>
    <v-btn v-if="focusNodes" icon title="Полная диаграмма" v-on:click="$emit('clearFocus')">
      <v-icon>mdi-view-comfy</v-icon>
    </v-btn>
    <v-btn v-if="isUnwisp" icon title="Показать все связи" v-on:click="$emit('setUnwisp', false)">
      <v-icon>mdi-arrow-decision-outline</v-icon>
    </v-btn>
    <v-btn v-if="!isUnwisp" icon title="Свернуть связи в жгуты" v-on:click="$emit('setUnwisp', true)">
      <v-icon>mdi-arrow-decision-auto</v-icon>
    </v-btn>
    <v-btn v-if="isShowLinks" icon title="Показать только структуру" v-on:click="$emit('setShowLinks', false)">
      <v-icon>mdi-monitor-dashboard</v-icon>
    </v-btn>
    <v-btn v-if="!isShowLinks" icon title="Показать связи" v-on:click="$emit('setShowLinks', true)">
      <v-icon>mdi-sitemap</v-icon>
    </v-btn>
    <v-btn v-if="warnings?.length" icon title="Предупреждения" v-on:click="sheet = !sheet">
      <v-icon style="color: rgb(255, 0, 0)">warning</v-icon>
    </v-btn>

    <v-bottom-sheet v-model="sheet">
      <v-card class="text-center" height="200">
        <v-card-text>
          <ul>
            <li v-for="warn in warnings" v-bind:key="warn">
              {{ warn }}
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <template v-if="scenario">
      <v-select v-model="selScenario" dense item-text="text" item-value="id" v-bind:items="scenarios" />
      <v-btn icon title="Проиграть сценарий" v-on:click="$emit('playScenario')">
        <v-icon>{{ isPaying ? "mdi-stop" : "mdi-play" }}</v-icon>
      </v-btn>
      <!--
            Имеются проблемы с перемоткой назад.
            Плохо отрабатывают шаги очистки, т.е. отмотать состояние не удается без артефактов
          <v-btn
            v-if="isPaying"
            icon
            title="Дальше"
            v-on:click="playPrev">
            <v-icon>mdi-skip-previous</v-icon>
          </v-btn>
          -->
      <v-btn v-if="isPaying" icon title="Дальше" v-on:click="$emit('playNext')">
        <v-icon>mdi-skip-next</v-icon>
      </v-btn>
    </template>
  </v-toolbar>
</template>

<script>
  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2024 Sber

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
      Vladislav Nefedov, Sber - 2024
  */

  export default {
    props: {
      isPrintVersion: { type: Boolean, default: false },
      selectedNodes: { type: Object, default: null },
      focusNodes: { type: Array, default: null },
      isUnwisp: { type: Boolean, default: false },
      isShowLinks: { type: Boolean, default: false },
      warnings: { type: Array, default: null },
      scenario: { type: String, default: '' },
      scenarios: { type: Array, default: null },
      isPaying: { type: Boolean, default: false }
    },
    data: () => ({
      sheet: false
    }),
    computed: {
      selScenario: {
        get() {
          return this.scenario;
        },
        set(value) {
          this.$emit('setScenario', value);
        }
      }
    }
  };
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 0px;
  left: 6px;
  margin-left: 6px;
  max-width: calc(100% - 32px);
  display: inline-flex;
  left: 10px;
}


</style>
