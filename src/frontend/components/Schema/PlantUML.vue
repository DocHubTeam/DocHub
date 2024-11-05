<template>
  <div
    class="plantuml-place"
    v-on:contextmenu="showMenu">
    <error-boundary
      v-bind:params="{error}"
      stop-propagation>
      <v-progress-circular
        v-if="isLoading"
        v-bind:size="64"
        v-bind:width="7"
        style="left: 50%; top: 50%; position: absolute; margin-left: -32px; margin-top: -32px;"
        v-bind:value="60"
        color="primary"
        indeterminate />
      <template v-else-if="render">
        <div v-if="ifShowFullscreen" class="fullscreen-icon">
          <v-icon v-on:click="toggleFullscreen">
            {{ isFullScreen ? 'mdi-close-box-outline' : 'fullscreen' }}
          </v-icon>
        </div>
        <div
          class="plantuml-schema"
          v-on:mousedown.prevent="zoomAndPanMouseDown"
          v-on:mousemove.prevent="zoomAndPanMouseMove"
          v-on:mouseup.prevent="zoomAndPanMouseUp"
          v-on:mouseleave.prevent="zoomAndPanMouseUp"
          v-on:wheel="zoomAndPanWheelHandler"
          v-html="svg" />
      </template>
    </error-boundary>
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
  </div>
</template>

<script>
  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2022 Sber

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
      R.Piontik <r.piontik@mail.ru> - 2021
      R.Piontik <r.piontik@mail.ru> - 2022
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Navasardyan Suren, Sber - 2022
      Vladislav Markin, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Nefedov, Sber - 2024
  */

  import { ErrorBoundary } from '@front/shared/ErrorBoundary/index';

  import plantUML from '@front/helpers/plantuml';
  import href from '@front/helpers/href';
  import copyToClipboard from '@front/helpers/clipboard';
  import download from '@front/helpers/download';
  import fullScreen from '@front/helpers/fullscreen';

  import ZoomAndPan from './zoomAndPan';

  const EVENT_COPY_SOURCE_TO_CLIPBOARD = 'copysource';

  export default {
    name: 'PlantUML',
    components: {
      ErrorBoundary
    },
    mixins: [ZoomAndPan],
    props: {
      uml: { type: String, default: '' },         // PlantUML диаграмма
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      postrender: { type: Function, default: () => {} }, // POST обработчик
      sourceAvailable: { type: Boolean, default: false },
      contextMenu: { type: Array, default() {return []; } }
    },
    emits: [
      EVENT_COPY_SOURCE_TO_CLIPBOARD // Копирование источника данных
    ],
    data() {
      return {
        menu: { // Контекстное меню
          show: false,  // Признак отображения
          x : 0,  // Позиция x
          y : 0,  // Позиция y
          items: (() => {
            const result = [
              { id: 'copy-puml', title: 'Копировать PlantUML', on: () => copyToClipboard(this.uml) }
            ];
            this.sourceAvailable && result.push({ title: 'Копировать JSON', on: () => this.$emit(EVENT_COPY_SOURCE_TO_CLIPBOARD) });
            return result;
          }).call()
        },
        render: true,
        error: null,
        rerenderTimer: null,
        svg: '',
        isLoading: true,
        svgEl: null,
        isFullScreen: false,
        ifShowFullscreen: fullScreen.isAvailable()
      };
    },
    computed: {
      zoomAndPanElement() {
        return this.svgEl;
      },
      viewBox() {
        if (this.cacheViewBox) return this.cacheViewBox;
        let result = null;
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
          // eslint-disable-next-line no-useless-escape
          const regex = /<svg.*?viewBox=\"(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\".*?>/;
          const parsed = this.svg.match(regex);
          parsed && (result = {
            x: Number.parseFloat(parsed[1]),
            y: Number.parseFloat(parsed[2]),
            width: Number.parseFloat(parsed[3]),
            height: Number.parseFloat(parsed[4])
          });
        } else if (this.svgEl) result = this.svgEl.viewBox.baseVal;
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        return result ? (this.cacheViewBox = result) : { x:0, y:0, width:0, height:0 };
      },
      menuItems() {
        const result = [].concat(this.contextMenu);
        result.length && result.push(null);
        if (!this.error) {
          result.push(
            { id:'save-svg', title: 'Сохранить на диск SVG', on: () => download.downloadSVG(this.svg)}
          );
          result.push(
            { id: 'save-png', title: 'Сохранить на диск PNG', on: () => download.downloadSVGAsPNG(this.svg) }
          );
        }
        return result.concat(this.menu.items);
      }
    },
    watch: {
      uml() {
        this.reloadSVG();
      }
    },
    mounted() {
      window.addEventListener('resize', this.reRender);
      new ResizeObserver(this.reRender).observe(this.$el);
      this.reloadSVG();
    },
    beforeDestroy(){
      window.removeEventListener('resize', this.reRender);
    },
    methods: {
      toggleFullscreen() {
        fullScreen.toggle(this.$el, (value) => {
          this.isFullScreen = value;
        });
      },
      reRender() {
        if (this.rerenderTimer) clearTimeout(this.rerenderTimer);
        this.rerenderTimer = setTimeout(() => {
          this.render = false;
          this.$nextTick(() => {
            this.render = true;
            this.$nextTick(() => {
              this.prepareSVG();
              this.$nextTick(() => this.doResize());
            });
          });
        }, 0);
      },
      doResize() {
        if (!this.svgEl || !this.svgEl.clientWidth || !this.svgEl.clientHeight) return;

        const originWidth = this.viewBox.width;

        if (this.$el.clientWidth > this.viewBox.width) {
          this.viewBox.width = this.$el.clientWidth;
        }

        const originHeight = this.viewBox.height * (this.svgEl.clientWidth / this.viewBox.width);

        this.svgEl.style.height = originHeight;

        if (originHeight < this.$el.clientHeight) {
          const k = this.viewBox.height / originHeight;
          this.svgEl.style.height = this.$el.clientHeight;
          this.viewBox.height = this.$el.clientHeight * k;
        }

        const offsetX = (this.viewBox.width - originWidth) / 2;
        const offsetY = (this.$el.clientHeight - originHeight) / 2;
        this.viewBox.x -= offsetX;
        this.viewBox.y -= offsetY > 0 ? offsetY : 0;
      },
      prepareSVG() {
        this.svgEl = this.$el.querySelectorAll('svg')[0];
        this.cacheViewBox = null;
        if (this.svgEl) {
          this.svgEl.style = null;
          this.svgEl.setAttribute('encoding', 'UTF-8');
          this.doResize();
          href.elProcessing(this.svgEl);
          if (this.postrender) this.postrender(this.svgEl);
        }
      },
      reloadSVG() {
        if (!this.uml) {
          this.svg = '';
          return;
        }

        this.error = null;
        this.isLoading = true;

        this.$nextTick(() => {
          const request = plantUML.prepareRequest(this.uml);

          request.then((response) => {
            this.svg = response.data.toString();
            this.isLoading = false;
            this.$nextTick(() => this.reRender());
          }).catch((error) => {
            if (error.response && error.response.status === 400) {
              this.$nextTick(() => this.reRender());
            }
            this.error = error;
          }).finally(()=> {
            this.isLoading = false;
          });
        });
      },
      showMenu(event) {
        this.menu.show = false;
        this.menu.x = event.clientX;
        this.menu.y = event.clientY;
        this.$nextTick(() => {
          this.menu.show = true;
        });
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };
</script>

<style>

.plantuml-schema {
  width: 100%;
}

.plantuml-schema svg {
  width: 100%;
  height: auto;
}
.plantuml-place {
  position: relative;
  background-color: #fff;
}
.plantuml-place:hover .fullscreen-icon {
  display:block !important;
}
.fullscreen-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  display: none;
}
</style>
