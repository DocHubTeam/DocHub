<template>
  <svg
    ref="zoomAndPan"
    class="dochub-schema"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    contentstyletype="text/css"
    preserveAspectRatio="none"
    version="1.1"
    v-bind:viewBox="viewBox"
    encoding="UTF-8"
    stroke="transparent"
    v-bind:style="style"
    v-on:wheel="zoomAndPanWheelHandler"
    v-on:mousedown.prevent="(e) => { zoomAndPanMouseDown(e); onClickSpace(e) }"
    v-on:mousemove.prevent="zoomAndPanMouseMove"
    v-on:mouseup.prevent="zoomAndPanMouseUp"
    v-on:mouseleave.prevent="zoomAndPanMouseUp">
    <template v-if="isFirefox">
      <g class="symbols">
        <g v-for="symbol in symbols" v-bind:id="symbol.id" v-bind:key="symbol.id" v-html="symbol.content" />
      </g>
    </template>
    <template v-else>
      <defs>
        <g v-for="symbol in symbols" v-bind:id="symbol.id" v-bind:key="symbol.id" v-html="symbol.content" />
      </defs>
    </template>
    <text
      v-if="data.header"
      id="title"
      v-bind:x="landscape.viewBox.titleX"
      v-bind:y="landscape.viewBox.top + 6"
      alignment-baseline="hanging"
      v-bind:style="titleStyle">{{ data.header.title }}
    </text>
    <schema-node
      v-bind:offset-x="0"
      v-bind:offset-y="0"
      mode="area"
      v-bind:layer="presentation.layers"
      v-bind:hide-boundary-titles="data.config?.hideBoundaryTitles"
      v-bind:hide-leaf-titles="data.config?.hideLeafTitles"
      v-on:node-dblclick="onNodeClick" />

    <template v-for="track in presentation.tracks">
      <schema-track
        v-if="isShowTrack(track)"
        v-bind:key="track.id"
        v-bind:track="track"
        v-bind:line-width-limit="lineWidthLimit"
        v-bind:thin="lineThin"
        v-on:track-over="onTrackOver(track)"
        v-on:track-click="onTrackClick(track)"
        v-on:track-title-click="onTrackTitleClick(track)"
        v-on:track-leave="onTrackLeave(track)" />
    </template>

    <schema-node
      v-bind:offset-x="0"
      v-bind:offset-y="0"
      mode="node"
      v-bind:layer="presentation.layers"
      v-bind:hide-boundary-titles="data.config?.hideBoundaryTitles"
      v-bind:hide-leaf-titles="data.config?.hideLeafTitles"
      v-on:node-click="onNodeClick" />

    <schema-info
      v-show="animation.information"
      v-bind:x="landscape.viewBox.left + 12"
      v-bind:width="landscape.viewBox.width - 24"
      v-bind:text="animation.information" />

    <schema-debug-node
      v-if="debug"
      v-bind:offset-x="0"
      v-bind:offset-y="0"
      v-bind:layer="presentation.layers"
      v-on:node-click="onNodeClick" />


    <template v-if="isBuilding">
      <rect
        fill="#fff"
        opacity="0.8"
        v-bind:x="landscape.viewBox.left"
        v-bind:y="landscape.viewBox.top"
        v-bind:width="landscape.viewBox.width"
        v-bind:height="landscape.viewBox.height" />
      <circle
        v-if="isBuilding"
        class="spinner"
        v-bind:cx="landscape.viewBox.left + landscape.viewBox.width * 0.5 - 25"
        v-bind:cy="landscape.viewBox.top + landscape.viewBox.height * 0.5 - 25"
        r="20"
        fill="none"
        stroke-width="5" />
    </template>

    <template v-if="error">
      <text
        v-bind:x="landscape.viewBox.left"
        v-bind:y="landscape.viewBox.top + 30"
        class="error">
        <tspan
          v-for="line in errorLines"
          v-bind:key="line"
          x="0"
          dy="1.2em">
          {{ line }}
        </tspan>
      </text>
    </template>

    Тут должны была быть схема, но что-то пошло не так...
  </svg>
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
      Vladislav Markin, Sber - 2023
      Vladislav Nefedov, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Nefedov, Sber - 2024
  */

  import { v4 as uuidv4 } from 'uuid';

  import href from '@front/helpers/href';

  import SchemaNode from './DHSchemaNode.vue';
  import SchemaTrack from './DHSchemaTrack.vue';
  import SchemaDebugNode from './DHSchemaDebugNode.vue';
  import md5 from 'md5';

  import ZoomAndPan from '../zoomAndPan';

  const CACHE_VERSION = 1; //Версия кеша, для контроля совместимости в новых версиях

  const Graph = new function() {
    const codeWorker = require(`!!raw-loader!${process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE}`).default;
    const scriptBase64 = btoa(unescape(encodeURIComponent(codeWorker)));
    const scriptURL = 'data:text/javascript;base64,' + scriptBase64;

    // Слушатели запросов
    const listeners = {};

    const worker = new Worker(scriptURL);
    worker.onmessage = (message)=> {
      const queryID = message.data.queryID;
      listeners[queryID] && listeners[queryID](message.data);
    };
    this.make = (grid, styles, nodes, links, trackWidth, distance, direction, height, symbols, availableWidth, wrap, isDebug) => {
      return new Promise((success, reject) => {
        const params = {
          grid, styles, nodes, links, trackWidth, distance, direction, height, symbols, wrap, isDebug
        };
        const hash = window.localStorage ? md5(JSON.stringify(params)) : null;
        const cacheKey = `SmartAnts.cache.v${CACHE_VERSION}.${hash}`;

        // Пытаемся достать результат из кэша
        let cacheData = null;
        if (cacheKey) {
          cacheData = localStorage.getItem(cacheKey);
          cacheData = cacheData ? JSON.parse(cacheData): null;
        }
        // Если кэш есть, отдаем результат из него
        if (cacheData) {
          success(cacheData);
        } else {
          // Иначе запускаем построение диаграммы
          const queryID = uuidv4();
          params.availableWidth = availableWidth;
          listeners[queryID] = (message) => {
            try {
              if (message.result === 'OK') {
                if (message.graph?.warnings?.length === 0) {
                  // Кэшируем успешный результат
                  try {
                    // md5 && localStorage.setItem(cacheKey, JSON.stringify(message.graph));
                  } catch (e) {
                    //todo:разобраться с переполнением кэша
                    // eslint-disable-next-line no-console
                    console.warn(`Can't cache SA result: ${e}`);
                  }
                }
                success(message.graph);
              }
              else reject(message.error);
            } finally {
              delete listeners[queryID];
            }
          };
          worker.postMessage({
            queryID,
            params: JSON.parse(JSON.stringify(params))
          });
        }
      });
    };
  };

  import DHSchemaAnimationMixin from './DHSchemaAnimationMixin';
  import DHSchemaExcalidrawMixin from './DHSchemaExcalidrawMixin';
  import SchemaInfo from './DHSchemaInfo.vue';

  // SVG примитивы
  import SVGSymbolCloud from '!!raw-loader!./symbols/cloud.xml';
  import SVGSymbolUser from '!!raw-loader!./symbols/user.xml';
  import SVGSymbolSystem from '!!raw-loader!./symbols/system.xml';
  import SVGSymbolDatabase from '!!raw-loader!./symbols/database.xml';
  import SVGSymbolComponent from '!!raw-loader!./symbols/component.xml';

  const OPACITY = 0.3;
  const IS_DEBUG = false;
  const CHAR_WIDTH = 16;

  export default {
    name: 'DHSchema',
    components: {
      SchemaNode,
      SchemaTrack,
      SchemaInfo,
      SchemaDebugNode
    },
    mixins: [ DHSchemaAnimationMixin, DHSchemaExcalidrawMixin, ZoomAndPan],
    props: {
      // Толщина линии дорожки
      fullScreen: {
        type: Boolean,
        default: false
      },
      // Направление диаграммы
      direction: {
        type: String,
        default: 'row'
      },
      // Высота для колоночной диаграммы
      height: {
        type: Number,
        default: 700
      },
      // Варнинги генерации диаграммы
      warnings: {
        type: Array,
        default: () => []
      },
      // Дистанция между объектами на диаграмме
      distance: {
        type: Number,
        default: 70
      },
      // Ширина прогладываемых дорожек
      trackWidth: {
        type: Number,
        default: 28
      },
      // Показывать связи
      showLinks: {
        type: Boolean,
        default: true
      },
      // Толщина линии дорожки
      trackStrong: {
        type: Number,
        default: 1
      },
      //
      voice: {
        type: Boolean,
        default: true
      },
      data: {
        type: Object,
        default() {
          return {
            symbols: {},
            nodes: {},
            links: [],
            animation: {
              actions: {},
              scenarios: []
            }
          };
        }
      }
    },
    emits: ['update:warnings'],
    data() {
      return {
        isBuilding: 0,
        resizer: null,
        debug: IS_DEBUG ? {

        } : null,
        selected: {
          links: {},
          nodes: {}
        },
        landscape: {
          symbols: {},
          viewBox : {
            left: 0,
            top: 0,
            width: 1000,
            height: 400
          }
        },
        presentation: {
          layers: {},
          tracks: []
        },
        style: {},
        error: null
      };
    },
    computed: {
      errorLineLength() {
        return +this.viewBox.split(' ')[2] / CHAR_WIDTH;
      },
      // Разбиваем error message на строки
      errorLines() {
        const lines = [];
        let curLineLength = 0;
        let curLineString = '';
        this.error.split(' ').forEach(word => {
          curLineLength += word.length;
          curLineString = `${curLineString} ${word} `;
          if(curLineLength > this.errorLineLength) {
            lines.push(curLineString);
            curLineLength = 0;
            curLineString = '';
          }
        });
        lines.push(curLineString);
        return lines;
      },
      // Проверяем что в Firefox
      isFirefox() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      },
      limitHeight() {
        return this.fullScreen ? screen.height : null;
      },
      limitWidth() {
        return this.fullScreen ? screen.width : null;
      },
      lineWidthLimit() {
        return +this.data.config?.lineWidthLimit || 20;
      },
      lineThin() {
        return this.data.config?.lineThin || false;
      },
      lineOpacity() {
        return this.data.config?.lineOpacity || 1.0;
      },
      titleStyle() {
        const style = this.data?.header?.style || {};
        const result = {};
        style.color && (result.fill = style.color);
        style['font-weight'] && (result['font-weight'] = style['font-weight']);
        style['font-size'] && (result['font-size'] = style['font-size']);
        return result;
      },
      // Возвращает определения (defs) примитивов диаграммы
      symbols() {
        const result = [
          {
            id: '$landscape',
            content: '<g></g>'
          },
          {
            id: '$undefined',
            content: '<text>Ошибочка :(</text>'
          },
          {
            id: 'cloud',
            content: SVGSymbolCloud
          },
          {
            id: 'system',
            content: SVGSymbolSystem
          },
          {
            id: 'database',
            content: SVGSymbolDatabase
          },
          {
            id: 'user',
            content: SVGSymbolUser
          },
          {
            id: 'component',
            content: SVGSymbolComponent
          }
        ];
        for (const id in this.data.symbols || {}) {
          result.push({
            id,
            content: this.data.symbols[id]
          });
        }
        return result;
      },
      // Определяем окно видимости
      viewBox() {
        return `${this.landscape.viewBox.left} ${this.landscape.viewBox.top} ${this.landscape.viewBox.width} ${this.landscape.viewBox.height}`;
      }
    },
    watch: {
      fullScreen() {
        this.$nextTick(() => this.rebuildViewBox());
      },
      data() {
        this.$nextTick(() => this.rebuildPresentation());
      },
      '$store.state.isFullScreenMode'() {
        this.$nextTick(() => this.rebuildPresentation());
      },
      'selected.nodes'(value) {
        this.$emit('selected-nodes', value);
      },
      'animation.information'() {
        this.rebuildViewBox();
      }
    },
    mounted() {
      window.addEventListener('resize', () => {
        this.resizer && clearTimeout(this.resizer);
        this.resizer = setTimeout(() => {
          this.rebuildViewBox();
        }, 500);
      });
      // new ResizeObserver(() => this.rebuildViewBox()).observe(this.$el);
      this.$nextTick(() => {
        this.rebuildPresentation();
      });
    },
    beforeDestroy(){
      window.removeEventListener('resize', this.rebuildViewBox);
    },
    methods: {
      // Отчистка
      clear() {
        this.presentation = {
          layers: {},
          tracks: []
        };
      },
      // Отчистка выбора
      clearSelect() {
        this.cleanSelectedTracks();
        this.cleanSelectedNodes();
      },
      // Проверяет нужно ли выводить трек
      isShowTrack(track) {
        return this.showLinks || this.selected?.links[track.id];
      },
      isIgnoreClick() {
        return window?.event?.shiftKey || window?.event?.ctrlKey;
      },
      // Обновление состояние визуализации нод
      updateNodeView() {
        const map = this.presentation.map;
        const unselected = !Object.keys(this.selected.nodes).length;
        for(const id in map)  {
          const node = map[id];
          this.$set(node, 'opacity', unselected || this.selected.nodes[id] ? 1 : OPACITY);
        }
      },
      // Выделяет структуру или ноду
      getSelectNode(box) {
        const selected = {
          ...this.selected.nodes,
          [box.node.id]: box
        };

        const deepSelection = (parent) => {
          (parent.node.boxes || []).map((child) => {
            selected[child.node.id] = child;
            deepSelection(child);
          });
        };

        deepSelection(box);

        return selected;
      },
      // Выделяет ноду
      selectNode(box) {
        this.selected.nodes[box.node.id] = box;
      },
      // Выделяет ноду и ее соседей со связями
      selectNodeAndNeighbors(box) {
        const selectedNodes = this.getSelectNode(box);
        this.presentation.tracks.map((track) => {
          if ((selectedNodes[track.link.from]) || (selectedNodes[track.link.to])) {
            this.selected.links[track.id] = track;
            this.selected.nodes[track.link.from] = this.presentation.map[track.link.from];
            this.selected.nodes[track.link.to] = this.presentation.map[track.link.to];
          }
        });
        this.selected.nodes = {
          ...selectedNodes,
          ...this.selected.nodes
        };
      },
      // Обработка клика по объекту
      onNodeClick(box) {
        !this.isIgnoreClick() && this.clearSelect();
        this.selectNodeAndNeighbors(box);
        this.updateNodeView();
        this.updateTracksView();
      },
      updateTracksView() {
        const unselected = !Object.keys(this.selected.links).length && !Object.keys(this.selected.nodes).length;
        this.presentation.tracks = this.presentation.tracks.map((track) => {
          if (unselected) {
            this.$set(track, 'animate', false);
            this.$set(track, 'opacity', this.lineOpacity);
          } else {
            this.$set(track, 'highlight', !!this.selected.links[track.id]);
            this.$set(track, 'animate', track.highlight);
            this.$set(track, 'opacity', track.animate ? this.lineOpacity : OPACITY * this.lineOpacity);
          }
          return track;
        }).sort((track1, track2) => {
          if (track1.highlight && track2.highlight) return -1;
          if (track1.highlight && !track2.highlight) return 0;
          return 1;
        });
      },
      // Фиксируем выбор линка
      onTrackClick(track) {
        if (!this.isIgnoreClick()) {
          this.cleanSelectedTracks();
          this.cleanSelectedNodes();
        }
        this.selected.links[track.id] = track;
        this.selected.nodes[track.link.from] = this.presentation.map[track.link.from];
        this.selected.nodes[track.link.to] = this.presentation.map[track.link.to];
        this.selected.nodes = {...this.selected.nodes};
        this.updateNodeView();
        this.updateTracksView();
      },
      // Клик по заголовку линка. Если есть переход, переходим,
      // если нет - стандартное действие для клика по треку
      onTrackTitleClick(track) {
        if(track.link.link) {
          this.$emit('on-click-link', track.link);
        } else {
          this.$emit('track-click', track.link);
        }
      },
      // Обработка событий прохода мышки над связями
      onTrackOver(track) {
        track.highlight =  true;
        this.updateTracksView();
      },
      onTrackLeave(track) {
        if (!this.selected.links[track.id]) {
          this.$set(track, 'highlight', false);
        }
      },
      // Очистка выбора треков
      cleanSelectedTracks() {
        this.selected.links = {};
        this.presentation.tracks.map((track) => {
          this.$set(track, 'animate', false);
          this.$set(track, 'opacity', this.lineOpacity);
          this.$set(track, 'highlight', false);
        });
      },
      // Очистка выбора треков
      cleanSelectedNodes() {
        this.selected.nodes = {};
      },
      // Обработка клика на свободной области
      onClickSpace(event) {
        if(this.isIgnoreClick()) return;
        event = event || window.event;
        if (event.which === 1) {
          this.cleanSelectedTracks();
          this.cleanSelectedNodes();
          this.updateNodeView();
        } else event.preventDefault();
      },
      // Перестроить viewbox
      rebuildViewBox() {
        const width = this.presentation.valueBox?.dx - this.presentation.valueBox.x;
        let height = Math.max(this.presentation.valueBox.dy - this.presentation.valueBox.y, this.limitHeight || 100);
        const clientWidth = this.$el?.clientWidth || 0;
        const titleWidth = this.$el?.querySelector('#title')?.clientWidth || 0;

        this.landscape.viewBox.titleX = this.presentation.valueBox.x + (this.presentation.valueBox?.dx - this.presentation.valueBox.x)/2 - titleWidth/2;

        this.landscape.viewBox.top = this.presentation.valueBox.y - (height - this.presentation.valueBox.dy + this.presentation.valueBox.y)/2;

        if (this.animation.information) {
          this.landscape.viewBox.top -= 64;
          height += 64;
        }

        this.landscape.viewBox.height = height + 60;

        if (width < clientWidth) {
          const delta = (clientWidth - width) * 0.5;
          this.landscape.viewBox.left = - delta + this.presentation.valueBox.x;
          this.landscape.viewBox.width = width + delta * 2;
          this.$el.style.height = `${height + 60}px`;
        } else {
          this.landscape.viewBox.left = this.presentation.valueBox.x - 24;
          this.landscape.viewBox.width = width + 48;
          this.$el.style.height = `${height * (clientWidth / width) + 60}px`;
        }
      },
      // Перестроение презентации
      rebuildPresentation(nodes, links) {
        this.error = null;
        this.recalcSymbols();
        const trackWidth = this.data.config?.trackWidth || this.trackWidth;
        const distance = this.data.config?.distance || this.distance;
        const direction = this.data.config?.direction || this.direction;
        const height = this.data.config?.height || this.height;
        let availableWidth = this.$el?.clientWidth || 0;
        if (availableWidth < 600) availableWidth = 600;
        this.isBuilding++;
        Graph.make(
          this.data.config?.grid || {},
          this.data.config?.styles || {},
          nodes || this.data.nodes || {},
          links || this.data.links || [],
          trackWidth,
          distance,
          direction,
          height,
          this.landscape.symbols,
          availableWidth,
          this.limitHeight,
          this.data.config?.wrap,
          this.debug
        )
          .then((presentation) => {
            if(presentation.warnings?.length)
              this.$emit('update:warnings', presentation.warnings);
            this.presentation = presentation;
            this.rebuildViewBox();
            this.cleanSelectedTracks();
            this.cleanSelectedNodes();
            this.$nextTick(() => this.$el && href.elProcessing(this.$el));
          })
          .catch((e) => {
            this.error = e.text;
            // eslint-disable-next-line no-console
            console.error(e);
          })
          .finally(() => {
            this.isBuilding > 0 && this.isBuilding--;
          });
      },
      // Рассчитывает размерность примитивов (символов)
      recalcSymbols() {
        this.landscape.symbols = {};
        this.symbols.map((item) => {
          const symbol = this.$el.getElementById(item.id);
          const bbox = symbol.getBBox();
          this.landscape.symbols[item.id] = {
            x: 0,
            y: 0,
            height: bbox.height + bbox.y,
            width: bbox.width + bbox.x
          };
        });
      }
    }
  };
</script>

<style scoped>

.dochub-schema {
  /* border: solid 2px #ff0000; */
  /* max-height: calc(100vh - 64px); */
  aspect-ratio: unset;
}

.wave-cell {
  stroke: #000;
  fill-opacity: 0;
}

.path-cell {
  stroke: #0000ff;
  fill-opacity: 0;
}
.wave-point {
  stroke: #00FF00;
  fill-opacity: 0;
}

.error-cell {
  fill: #f00;
  stroke: #fff;
}

.symbols * {
  opacity: 0;
}

.spinner {
  stroke: rgb(52, 149, 219);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.error {
  stroke: red;
  fill: red;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

* {
  transition: all 0.15s ease-in;
}

</style>
