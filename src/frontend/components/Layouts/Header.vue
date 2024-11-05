<template>
  <v-app-bar
    app
    clipped-left
    color="#3495db"
    dark
    v-bind:class="isPrintVersion ? 'print-version' : ''"
    style="z-index: 99">
    <div class="main-layout__header">
      <div class="main-layout__header__menu">
    <i class="fa-solid fa-bug" />
    <v-app-bar-nav-icon v-on:click="() => handleDrawer()">
      <header-logo />
    </v-app-bar-nav-icon>
    <v-toolbar-title style="cursor: pointer" v-on:click="onLogoClick">DocHub</v-toolbar-title>
    <v-btn v-if="isBackShow" icon v-on:click="back">
      <v-icon>arrow_back</v-icon>
    </v-btn>
    <v-btn v-if="isBackShow" icon v-on:click="debug">
      <v-icon>mdi-bug</v-icon>
    </v-btn>
    <v-btn v-if="isBackShow" icon v-on:click="refresh">
      <v-icon>refresh</v-icon>
    </v-btn>
      </div>
      <div v-if="isRolesMode" class="main-layout__header__menu">
        <v-toolbar-title right offset-y style="cursor: pointer" v-on:click="loginout()">{{
            user || 'Login'
          }}
        </v-toolbar-title>
        <v-spacer />
    <v-btn v-if="isCriticalError" icon title="Есть критические ошибки!" v-on:click="gotoProblems">
      <v-icon class="material-icons blink" style="display: inline">error</v-icon>
    </v-btn>
    <v-btn v-if="gotoIconShow" icon title="Найти в коде" v-on:click="gotoCode">
      <v-icon class="material-icons" style="display: inline">code</v-icon>
    </v-btn>
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn icon v-bind="attrs" v-on="on">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-checkbox v-model="isPrintVersion" />
          <v-list-item-title>Версия для печати</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-list-item-title style="cursor: pointer;" v-on:click="doPrint">Печать</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
      </div>
    </div>
  </v-app-bar>
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
      Vladislav Nefedov, Sber - 2023
      Vladislav Markin, Sber - 2023
      Nikolay Temnyakov, Sber - 2024
  */

  import env, {Plugins} from '@front/helpers/env';
  import oidcClient from '@front/auth/oidc-client';

  import HeaderLogo from './HeaderLogo';

  export default {
    name: 'Header',
    components: {
      HeaderLogo
    },
    data() {
      return {
        isBackShow: env.isPlugin(Plugins.vscode),
        user: null
      };
    },
    computed: {
      isRolesMode() {
        return env.isRolesMode();
      },
      gotoIconShow() {
        return env.isPlugin() && this.$route.name === 'entities';
      },
      isCriticalError() {
        return !!(this.$store.state.problems || []).find((item) => item.critical);
      },
      isPrintVersion: {
        set(value) {
          this.handleDrawer(!value);
          this.$store.commit('setPrintVersion', value);
        },
        get() {
          return this.$store.state.isPrintVersion;
        }
      },
      isFullScreenMode: {
        set(value) {
          this.$store.commit('setFullScreenMode', value);
        },
        get() {
          return this.$store.state.isFullScreenMode;
        }
      }
    },
    mounted() {
      window.OidcUserManager.getUser().then(user => {
        const userName = user?.profile?.name;
        this.user = userName ? userName + ' (Logout)' : null;
        if (this.user) {
          window.Vuex.dispatch('reloadRootManifest');
        } else {
          window.Vuex.dispatch('clean');
        }
      });
    },
    methods: {
      doPrint() {
        window.print();
      },
      handleDrawer(value) {
        this.$emit('handleDrawer', value);
      },
      back() {
        this.$router.back();
      },
      gotoProblems() {
        this.$router.push({name: 'problems'}).catch(() => null);
      },
      debug() {
        window.$PAPI.debug();
      },
      async refresh() {
        const currentRoute = { path: this.$route.path, query: this.$route.query };
        await window.$PAPI.reload(currentRoute);
      },
      onLogoClick() {
        this.$router.push({name: 'main'}).catch(() => null);
      },
      gotoCode() {
        const location = window.location;
        const struct = window.location.hash.split('/');
        const entity = struct?.[2];
        const url = new URL(location.hash.slice(1), location);

        // Пытаюсь извлечь идентификатор из параметра содержащем "id" или "domain" (для berezka)
        // или в качестве идентификатора берется хвост от urlа
        // TODO: надо переделать
        const idRegex = /\b(\w*id|domain\w*)=([^&\s]+)\b/;
        const id = idRegex.exec(url.search)?.[2] || struct[struct.length -1];

        if(!entity || !id) return false;

        // Запрос в ide на открытие entity c id
        window.$PAPI.goto(null, entity, id);
      },
      loginout() {
        this.user ? oidcClient.logout() : oidcClient.login();
        console.log("login/logout");
        this.user ? oidcClient.logout() : oidcClient.login().then(() => {
          window.Vuex.dispatch('setRolesFromToken');
          console.log("call set roles from token");
        });
      }
    }
  };
</script>

<style scoped>

.main-layout__header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.main-layout__header__menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

header.print-version {
  position: absolute;
}

@keyframes blink {
  50% {
    opacity: 0.0;
  }
}

.blink {
  color: #A00 !important;
  animation: blink 1s step-start 0s infinite;
}

</style>
