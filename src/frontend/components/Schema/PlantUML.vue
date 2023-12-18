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
      <div
        v-else-if="render"
        class="plantuml-schema"
        v-on:mousedown.prevent="zoomAndPanMouseDown"
        v-on:mousemove.prevent="zoomAndPanMouseMove"
        v-on:mouseup.prevent="zoomAndPanMouseUp"
        v-on:mouseleave.prevent="zoomAndPanMouseUp"
        v-on:wheel="zoomAndPanWheelHandler"
        v-html="svg" />
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
  import { ErrorBoundary } from '@front/shared/ErrorBoundary/index';

  import plantUML from '@front/helpers/plantuml';
  import href from '@front/helpers/href';
  import copyToClipboard from '@front/helpers/clipboard';
  import download from '@front/helpers/download';

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
        original: null,
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
        svgEl: null
      };
    },
    computed: {
      zoomAndPanElement() {
        return this.svgEl;
      },
      viewBox() {
        if (!this.svgEl) {
          return {
            x: 0,
            y : 0,
            width : 0,
            height : 0
          };
        } else
          return this.cacheViewBox ?
            this.cacheViewBox
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            : this.cacheViewBox = this.svgEl.viewBox.baseVal;
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
      },
      '$store.state.isFullScreenMode'() {
        this.prepareSVG();
      }
    },
    mounted() {
      window.addEventListener('resize', this.reRender);
      this.reloadSVG();
      let oldClientHeight = this.$el.clientHeight;
      new ResizeObserver(() => {
        if (oldClientHeight != this.$el.clientHeight) {
          this.doResize();
          oldClientHeight = this.$el.clientHeight;
        }
      }).observe(this.$el);

    },
    beforeDestroy(){
      window.removeEventListener('resize', this.reRender);
    },
    methods: {
      reRender() {
        if (this.rerenderTimer) clearTimeout(this.rerenderTimer);
        this.rerenderTimer = setTimeout(() => {
          this.render = false;
          this.$nextTick(() => {
            this.render = true;
            this.$nextTick(() => this.prepareSVG());
          });
        }, 300);
      },
      doResize() {
        if (!this.svgEl || !this.svgEl.clientWidth || !this.svgEl.clientHeight) return;

        const originWidth = this.viewBox.width;

        if (this.$el.clientWidth > this.viewBox.width) {
          this.viewBox.width = this.$el.clientWidth;
        }

        const originalHeight = this.viewBox.height * (this.svgEl.clientWidth / this.viewBox.width);

        this.svgEl.style.height = this.$store.state.isFullScreenMode
          ? Math.max(originalHeight, window.innerHeight)
          : originalHeight;

        if (originalHeight < this.$el.clientHeight) {
          const k = this.viewBox.height / originalHeight;
          this.svgEl.style.height = this.$el.clientHeight;
          this.viewBox.height = this.$el.clientHeight * k;
        }

        const offset = (this.viewBox.width - originWidth) / 2;
        this.viewBox.x -= offset;
      },
      saveOriginal() {
        const originalHeight = this.viewBox.height * (this.svgEl.clientWidth / this.viewBox.width);
        this.original = {
          height: originalHeight,
          viewBoxHeight: this.$el.clientHeight * this.viewBox.height / originalHeight
        };
      },
      resetToDefault() {
        this.viewBox.height = this.original.viewBoxHeight;
        this.svgEl.style.height = this.original.height;
      },
      prepareSVG() {
        this.svgEl = this.$el.querySelectorAll('svg')[0];
        this.cacheViewBox = null;
        if (this.svgEl) {
          this.svgEl.style = null;
          this.svgEl.setAttribute('encoding', 'UTF-8');
          if(this.original && !this.$store.state.isFullScreenMode)
            this.resetToDefault();
          else {
            this.saveOriginal();
            this.doResize();
          }

          href.elProcessing(this.svgEl);
          if (this.postrender) this.postrender(this.svgEl);
        }
      },
      reloadSVG() {
        // Сбрасываем параметры зума

        if (!this.uml) {
          this.svg = '';
          return;
        }

        if (this.error) {
          this.error = null;
        }

        this.isLoading = true;

        this.$nextTick(() => {
          const request = plantUML.prepareRequest(this.uml);

          request.then((response) => {
            this.svg = response.data.toString();
            this.isLoading = false;
            this.$nextTick(() => this.prepareSVG());
          }).catch((error) => {
            if (error.response && error.response.status === 400) {
              this.$nextTick(() => this.prepareSVG());
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

</style>
