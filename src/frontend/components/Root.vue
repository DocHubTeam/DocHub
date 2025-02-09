<template>
  <v-app
    id="keep"
    v-bind:class="{'no-select-text': isDrawerResize}">
    <header-component v-on:handleDrawer="handleDrawer" />
    <v-navigation-drawer
      ref="drawer"
      v-model="drawer"
      v-bind:width="width"
      v-bind:temporary="navIsTemporary"
      app
      clipped
      color="grey lighten-4"
      style="z-index: 999">
      <menu-component />
    </v-navigation-drawer>
    <plugin-init v-if="isNotInited" />
    <v-main v-else style="min-height:100%" class="router-view">
      <problems v-if="isCriticalError" />
      <router-view v-else />
    </v-main>
    <template v-if="isLoading">
      <div class="loading-splash" />
      <v-progress-circular
        class="whell"
        v-bind:size="64"
        v-bind:width="7"
        v-bind:value="60"
        color="primary"
        indeterminate />
    </template>
  </v-app>
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
      R.Piontik <r.piontik@mail.ru>
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Navasardyan Suren, Sber - 2023
  */

  import PluginInit from '@idea/components/Init.vue';
  import env from '@front/helpers/env';

  import MenuComponent from './Layouts/Menu';
  import HeaderComponent from './Layouts/Header';
  import Problems from './Problems/Problems.vue';

  const minDrawerSize = 200;
  const defaultDrawerSize = 300;

  export default {
    name: 'Root',
    components: {
      MenuComponent,
      HeaderComponent,
      PluginInit,
      Problems
    },
    data() {
      return {
        drawer: null,
        isDrawerResize: false,
        width: defaultDrawerSize,
        isPlugin: env.isPlugin()
      };
    },
    computed: {
      isLoading() {
        return this.$store.state.isReloading;
      },
      isNotInited() {
        return this.isPlugin && this.$store.state.notInited;
      },
      isCriticalError() {
        return this.isPlugin && this.$store.state.criticalError;
      },
      navIsTemporary() {
        return this.$store.state.isPrintVersion;
      }
    },
    mounted() {
      const el = this.$refs.drawer.$el;
      const drawerBorder = document.querySelector('.v-navigation-drawer__border');

      function resize(e) {
        document.body.style.cursor = 'ew-resize';
        if (e.clientX < minDrawerSize) return;
        el.style.width = `${e.clientX}px`;
      }

      drawerBorder && drawerBorder.addEventListener(
        'mousedown',
        (e) => {
          if (e.offsetX < minDrawerSize) {
            el.style.transition = 'initial';
            document.addEventListener('mousemove', resize, false);
            this.isDrawerResize = true;
          }
        },
        false
      );

      document.addEventListener(
        'mouseup',
        () => {
          el.style.transition = '';
          this.width = el.style.width;
          document.body.style.cursor = '';
          document.removeEventListener('mousemove', resize, false);
          this.isDrawerResize = false;
        },
        false
      );
    },
    methods: {
      handleDrawer(value) {
        this.drawer = value ?? !this.drawer;
      }
    }
  };
</script>

<style>
@import '~vuetify/dist/vuetify.min.css';
@import '~swagger-ui/dist/swagger-ui.css';

.swagger-ui {
  width: 100%;
}

.router-view > div > div {
  height: 100%;
}

.router-view > div > div > div {
  height: 100%;
}

.v-navigation-drawer__border {
  width: 3px !important;
  cursor: col-resize !important;
  background: #ccc !important;
}

.no-select-text * {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

.loading-splash {
  background: #FFF;
  opacity: 0.7;
  z-index: 10;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  filter: blur(8px);
  -webkit-filter: blur(8px);
}

.whell {
  z-index: 100;
  left: 50%;
  top: 50vh;
  position: absolute !important;
  margin-left: -32px;
  margin-top: -32px;
}

::selection {
  background-color: #3495db;
  color: #fff;
}

</style>
