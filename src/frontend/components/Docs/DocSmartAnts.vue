<template>
  <box class="smart-ants" style="min-width: 100%;">
    <v-card flat class="container" v-bind:style="{ padding: '0', 'margin-top': '0', 'min-width': isFullScreen ? '100%' : 'auto' }">
      <div v-if="ifShowFullscreen" class="fullscreen-icon">
        <v-icon v-on:click="toggleFullscreen">
          {{ isFullScreen ? 'mdi-close-box-outline' : 'fullscreen' }}
        </v-icon>
      </div>
      <smartants-bar
        v-bind:warnings="warnings"
        v-bind:selected-nodes="selectedNodes"
        v-bind:focus-nodes="focusNodes"
        v-bind:scenario="scenario"
        v-bind:scenarios="scenarios"
        v-bind:is-print-version="isPrintVersion"
        v-bind:is-show-links="isShowLinks"
        v-bind:is-unwisp="isUnwisp"
        v-bind:is-paying="isPaying"
        v-on:exportToExcalidraw="exportToExcalidraw"
        v-on:doFocus="doFocus"
        v-on:clearFocus="clearFocus"
        v-on:playScenario="playScenario"
        v-on:playNext="playNext"
        v-on:setScenario="setScenario"
        v-on:setUnwisp="setUnwisp"
        v-on:setShowLinks="setShowLinks" />
      <schema
        ref="schema"
        v-model="status"
        class="schema"
        v-bind:full-screen="isFullScreen"
        v-bind:warnings="warnings"
        v-bind:data="data"
        v-bind:show-links="isShowLinks"
        v-on:update:warnings="v => warnings = v"
        v-on:playstop="onPlayStop"
        v-on:playstart="onPlayStart"
        v-on:selected-nodes="onSelectedNodes"
        v-on:on-click-link="onClickLink"
        v-on:contextmenu="showMenu" />
      <v-menu
        v-model="menu.show"
        v-bind:position-x="menu.x"
        v-bind:position-y="menu.y"
        absolute
        offset-y>
        <v-list>
          <template
            v-for="(item, index) in menuItems">
            <v-list-item
              v-if="item"
              v-bind:key="item.id"
              link>
              <v-list-item-title
                v-on:click="item.on(item)">
                {{ item.title }}
              </v-list-item-title>
            </v-list-item>
            <v-divider v-else v-bind:key="index" />
          </template>
        </v-list>
      </v-menu>
    </v-card>
  </box>
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
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Nefedov, Sber - 2024
  */

  import Schema from '@front/components/Schema/DHSchema/DHSchema.vue';
  import SmartantsBar from './SmartAntsBar.vue';
  import href from '@front/helpers/href';
  import download from '@front/helpers/download';
  import fullScreen from '@front/helpers/fullscreen';

  import DocMixin from './DocMixin';
  import env from '@front/helpers/env';

  export default {
    name: 'DocSmartAnts',
    components: {
      Schema,
      SmartantsBar
    },
    mixins: [DocMixin],
    props: {
      document: { type: String, default: '' }
    },
    data() {
      return {
        isPlugin: env.isPlugin(),
        isFullScreen: false,
        warnings: [],
        sheet: false,
        menu: { // Контекстное меню
          show: false,  // Признак отображения
          x : 0,  // Позиция x
          y : 0,  // Позиция y
          items: (() => {
            const result = [
              { id:'save-svg', title: 'Сохранить на диск SVG', on: () => download.downloadSVG(this.getSvg())},
              { id: 'save-png', title: 'Сохранить на диск PNG', on: () => download.downloadSVGAsPNG(this.getSvg()) }
            ];
            return result;
          }).call()
        },
        status: {},             // Текущий статус схемы
        selectedScenario: null, // Выбранный сценарий
        isPaying: false,        // Признак проигрывания
        selectedNodes: null,    // Выбранные ноды
        focusNodes: null,       // Кадрированные ноды
        isUnwisp: false,        // Признак группировки связей
        isShowLinks: true,      // Нужно ли показывать связи?
        ifShowFullscreen: fullScreen.isAvailable()  // Доступно ли полноэкранное представление
      };
    },
    computed: {
      // Пункты контекстного меню
      menuItems() {
        const result = [].concat(this.contextMenu);
        result.length && result.push(null);
        return result.concat(this.menu.items);
      },
      // Выбранный сценарий анимации
      scenario: {
        set(value) {
          this.selectedScenario = value;
        },
        get() {
          if (this.selectedScenario) return this.selectedScenario;
          const scenarios = this.data?.animation?.scenarios;
          if (!scenarios) return null;
          return Object.keys(scenarios)[0];
        }
      },
      data() {
        let result = Object.assign({}, this.source.dataset || {});
        // Если нужно, оставляем только фокусные ноды и связи между ними
        if (this.focusNodes) {
          const links = [];
          (result.links || []).map((link) => {
            if ((this.focusNodes.indexOf(link.from) >=0 ) && (this.focusNodes.indexOf(link.to) >=0 ))
              links.push(link);
          });

          const nodes = {};
          this.focusNodes.map((id) => {
            nodes[id] = result.nodes[id];
            let nodeName = '';
            id.split('.').forEach(domain => {
              if(!nodeName.length) nodeName += domain;
              else nodeName = [nodeName, domain].join('.');
              if(!nodes[nodeName])
                nodes[nodeName] = result.nodes[nodeName];
            });
          });

          result = JSON.parse(JSON.stringify({
            config: result.config,
            symbols: result.symbols,
            links,
            nodes
          }));
        }
        // Если нужно, собираем в жгуты
        this.isUnwisp && (result.links = this.unwispLinks(result.links));
        return result;
      },
      scenarios() {
        const result = [];
        for(const id in this.data?.animation?.scenarios || {}) {
          result.push({
            id,
            text: this.data.animation.scenarios[id].title || id
          });
        }
        return result;
      },
      isTemplate() {
        return true;
      }
    },
    watch: {
      fullScreenDialog(value) {
        this.$store.commit('setFullScreenMode', value);
      }
    },
    methods: {
      toggleFullscreen() {
        fullScreen.toggle(this.$el, (value) => {
          this.isFullScreen = value;
        });
      },
      setScenario(value) {
        this.scenario = value;
      },
      // Возвращает SVG код диаграммы
      getSvg() {
        const addStyle = function(children) {
          for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof Element) {
              let cssText = '';
              let computedStyle = window.getComputedStyle(child, null);
              for (let i = 0; i < computedStyle.length; i++) {
                let prop = computedStyle[i];
                cssText += prop + ':' + computedStyle.getPropertyValue(prop) + ';';
              }
              child.setAttribute('style', cssText);
              addStyle(child.childNodes);
            }
          }
        };

        const svgElement = this.$refs.schema.$el;
        addStyle(svgElement.childNodes);

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // eslint-disable-next-line no-useless-escape
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
          source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        // eslint-disable-next-line no-useless-escape
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
          source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        return `<?xml version="1.0" standalone="no"?>\r\n${source}`;
      },
      // Выводим контекстное меню
      showMenu(event) {
        this.menu.show = false;
        this.menu.x = event.clientX;
        this.menu.y = event.clientY;
        this.$nextTick(() => {
          this.menu.show = true;
        });
        event.preventDefault();
        event.stopPropagation();
      },
      //Очистка состояния
      clean() {
        this.status = {};
        this.selectedScenario =null;
        this.isPaying = false;
        this.selectedNodes = null;
        this.focusNodes = null;
        this.isUnwisp = false;

      },
      // Сворачивает связи в жгуты
      unwispLinks(links) {
        const map = {};
        const result = [];
        links.map((link) => {
          let item = map[`${link.from}-${link.to}`] || map[`${link.to}-${link.from}`];
          if (!item) {
            item = Object.assign({}, link);
            item.contains = [link];
            item.title = '';
            map[`${item.from}-${item.to}`] = item;
            result.push(item);
          } else {
            item.contains.push(link);
            const originArrow = {
              start: item.style.slice(0, 1),
              end: item.style.slice(-1)
            };
            const addingArrow = {
              start: link.style.slice(0, 1),
              end: link.style.slice(-1)
            };
            if ((addingArrow.start) === '<' && (originArrow.start !== '<')) {
              item.style = `<${item.style}`;
            }
            if ((addingArrow.end) === '>' && (originArrow.end !== '>')) {
              item.style = `${item.style}>`;
            }
          }
        });
        return result;
      },
      // Устанавливает режим отображения структуры
      setShowLinks(value) {
        this.isShowLinks = value;
      },
      // Устанавливает режим сворачивания связей в жгуты
      setUnwisp(value) {
        this.isUnwisp = value;
      },
      // Очищает фокус
      clearFocus() {
        this.focusNodes = null;
      },
      // Сфокусироваться на выбранных нодах
      doFocus() {
        this.focusNodes = this.selectedNodes ? Object.keys(this.selectedNodes) : null;
      },
      // Обработка клика по ссылке
      onClickLink(link) {
        href.gotoURL(link.link);
      },
      // Изменение выбора нод
      onSelectedNodes(nodes) {
        this.selectedNodes = Object.keys(nodes).length ? nodes : null;
      },
      // Экспорт в Excalidraw
      exportToExcalidraw() {
        this.$refs.schema.$emit('exportToExcalidraw', {
          handler: (content) => download.downloadExcalidraw(content)
        });
      },
      // Событие остановки проигрывания сценария
      onPlayStop() {
        this.isPaying = false;
      },
      // Событие начала проигрывания сценария
      onPlayStart() {
        this.isPaying = true;
      },
      // Команда проиграть сценарий
      playScenario() {
        this.$refs.schema.$emit(this.isPaying ? 'stop' : 'play', this.scenario);
      },
      // Команда перейти на предыдущий шаг немедленно
      // todo нужно доработать возврат
      playPrev() {
        this.$refs.schema.$emit('prev');
      },
      // Команда перейти на следующий шаг немедленно
      playNext() {
        this.$refs.schema.$emit('next');
      },
      refresh() {
        this.clean();
        this.selectedScenario = null;
        this.isPaying = false;
        this.sourceRefresh();
      }
    }
  };
</script>

<style scoped>
.schema {
  /* border: solid 2px #ff0000; */
  aspect-ratio : 1 / 0.6;
  width: 100%;
  min-width: 100%;
}

.container {
  position: relative;
  position: relative;
}

.container:hover > .fullscreen-icon,
.dialog-card > .fullscreen-icon {
  display:block;
}
.fullscreen-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  display: none;
}

.dialog-card .toolbar {
  top: 5px;
  margin-left: 0;
}

.markdown-document .toolbar {
  margin-left: 0;
}

.fullscreen-dialog {
  z-index: 10000 !important;
}

.fullscreen-dialog div {
  margin-top: 100px;
}

</style>
