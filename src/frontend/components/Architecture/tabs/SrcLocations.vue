<template>
  <v-card class="card-item">
    <v-card-title>
      <v-icon left>settings</v-icon>
      <span class="title">Размещение</span>
    </v-card-title>
    <v-card-text class="headline font-weight-bold">
      <ul class="source-list">
        <li
          v-for="item in locations"
          v-bind:key="item.link"
          class="source-list-item">
          <d-c-link v-bind:href="item.link">{{ item.title }}</d-c-link>
        </li>
      </ul>
    </v-card-text>
  </v-card>
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

  import DCLink from '@front/components/Controls/DCLink.vue';

  export default {
    name: 'SrcLocation',
    components: { DCLink },
    props: {
      locations: { type: Array, default: () => ([]) }
    },
    data() {
      return {};
    }
  };
</script>

<style scoped>

  .card-item {
    width: 100%;
    margin-top: 12px;
  }

  .source-list-item {
    font-stretch: normal;
    font-size: 16px;
    font-weight: 300;
  }
</style>
