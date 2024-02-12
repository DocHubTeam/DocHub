<template>
  <v-toolbar v-if="!isPrintVersion" class="toolbar" rounded elevation="1" color="#fff">
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
      <v-select v-model="scenario" dense item-text="text" item-value="id" v-bind:items="scenarios" />
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
  export default {
    props: {
      isPrintVersion: { type: Boolean, default: false },
      selectedNodes: { type: Array, default: null },
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
    })
  };
</script>
