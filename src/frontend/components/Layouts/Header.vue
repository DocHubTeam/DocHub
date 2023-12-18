<template>
  <v-app-bar
    app
    clipped-left
    color="#3495db"
    dark
    v-bind:class="isPrintVersion ? 'print-version' : ''"
    style="z-index: 99">
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
          <v-checkbox v-model="isFullScreenMode" />
          <v-list-item-title>Полноэкранные диаграммы</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-list-item-title style="cursor: pointer;" v-on:click="doPrint">Печать</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script>
  import env, {Plugins} from '@front/helpers/env';

  import HeaderLogo from './HeaderLogo';

  export default {
    name: 'Header',
    components: {
      HeaderLogo
    },
    data() {
      return {
        isBackShow: env.isPlugin(Plugins.vscode)
      };
    },
    computed: {
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
      }
    }
  };
</script>

<style scoped>

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
