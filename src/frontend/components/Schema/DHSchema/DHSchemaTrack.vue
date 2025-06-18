<template>
  <g>
    <path
      v-bind:class="classesArrow"
      v-bind:d="arrows"
      v-bind:style="{ opacity: track.opacity, stroke: trackColor }"
      v-on:mouseover="onTrackOver"
      v-on:mouseleave="onTrackLeave"
      v-on:mousedown.stop.prevent="onTrackClick" />
    <path
      v-bind:id="id"
      v-bind:class="classesLine"
      v-bind:d="line"
      v-bind:style="{ opacity: track.opacity, 'stroke-width':strokeWidth, stroke: trackColor }"
      v-bind:stroke-width="strokeWidth"
      v-on:mouseover="onTrackOver"
      v-on:mouseleave="onTrackLeave"
      v-on:mousedown.stop.prevent="onTrackClick" />
    <text
      v-if="title"
      v-bind:x="title.point.x"
      v-bind:y="title.point.y"
      v-bind:style="{ opacity: track.opacity, fill: trackColor }"
      v-bind:transform="`rotate(${title.rotate}, ${title.point.x}, ${title.point.y})`"
      text-anchor="middle"
      v-bind:class="classesTitle"
      v-on:mouseover="onTrackOver"
      v-on:mouseleave="onTrackLeave"
      v-on:mousedown.stop.prevent="onTrackTitleClick">
      {{ title.text }}
    </text>
  </g>
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
      Vladislav Markin, Sber - 2023
      Vladislav Nefedov, Sber - 2024
  */

  import rounding from './rounding';

  const ARROW_WIDTH     = 2;
  const ARROW_HEIGHT    = 5;
  const TRACK_SMOOTHING = 4;

  export default {
    name: 'DHSchemaTrack',
    props: {
      track: {
        type: Object,
        required: true
      },
      lineWidthLimit: {
        type: Number,
        default: 20
      },
      thin: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
      };
    },
    computed: {
      strokeWidth() {
        let width = ((this.isUnwisp || []).length || 1);
        width = width < this.lineWidthLimit ? width : this.lineWidthLimit;
        return this.thin ? width : width + 1;
      },
      isUnwisp() {
        return this.track.link.contains;
      },
      trackColor() {
        return this.isUnwisp ? '' : this.track.link.style
          .match(/#(([a-fA-F0-9]{6}|[a-fA-F0-9]{3})|[a-z]+)/gi)
          ?.map(color => /#(([a-fA-F0-9]{6}|[a-fA-F0-9]{3}))/i.test(color) ? color : color.replace('#', ''))
          .at(-1);
      },
      // Определяем как и где будет выводиться надпись на линке
      title() {
        const path = this.simplePath;
        if ((path.length < 2) || !this.track.link.title || (this.track.length < 2))
          return null;

        const maxSegment = {
          size: 0,
          index: 0
        };

        for (let i = 1; i < path.length; i++) {
          const point = path[i];
          const a1 = Math.abs(path[i - 1].x - point.x);
          const a2 = Math.abs(path[i - 1].y - point.y);
          const size = Math.round(Math.sqrt(a1 * a1 + a2 * a2));
          if (size > maxSegment.size) {
            maxSegment.size = size;
            maxSegment.from = path[i - 1];
            maxSegment.to = point;
          }
        }

        const result = {
          text: this.track.link.title,
          rotate: 0
        };

        if (maxSegment.from.x !== maxSegment.to.x)
          result.point = {
            x: maxSegment.from.x - (maxSegment.from.x - maxSegment.to.x) * 0.5,
            y: maxSegment.from.y - 4
          };
        else {
          result.point = {
            y: maxSegment.from.y - (maxSegment.from.y - maxSegment.to.y) * 0.5,
            x: maxSegment.from.x + 4
          };
          result.rotate = 90;
        }

        return result;
      },
      id() {
        return this.track.id;
      },
      startArrow() {
        return ('-' + this.track.link.style).slice(-1);
      },
      endArrow() {
        return (this.track.link.style + '-').slice(0, 1);
      },
      // Стиль надписи
      classesTitle() {
        const result = ['track-title'];
        // Определяем нужно ли подсвечивать путь
        if (this.track.highlight) result.push('title-highlight');
        if (this.track.link.link) result.push('title-link');
        return result.join(' ');
      },
      // Стиль стрелок
      classesArrow() {
        return this.makeClass(true);
      },
      // Стиль линии
      classesLine() {
        return this.makeClass();
      },
      // Стрелки
      arrows() {
        let result = '';
        const track = this.track.path;
        if (track.length < 2) return '';
        // Расставляем стрелки завершения пути
        [
          { curr : track[track.length - 1], prev: track[track.length - 2], after: true, arrow: this.endArrow},
          { curr : track[0], prev: track[1], arrow: this.startArrow}
        ].map((pice) =>{
          let arrow = '';
          if ((pice.prev.x === pice.curr.x) && (pice.prev.y < pice.curr.y))
            arrow = this.makeArrow(pice.curr.x, pice.curr.y, pice.arrow, 'down');
          else if ((pice.prev.x === pice.curr.x) && (pice.prev.y > pice.curr.y))
            arrow = this.makeArrow(pice.curr.x, pice.curr.y, pice.arrow, 'up');
          else if ((pice.prev.x < pice.curr.x) && (pice.prev.y === pice.curr.y))
            arrow = this.makeArrow(pice.curr.x, pice.curr.y, pice.arrow, 'left');
          else if ((pice.prev.x > pice.curr.x) && (pice.prev.y === pice.curr.y))
            arrow = this.makeArrow(pice.curr.x, pice.curr.y, pice.arrow, 'right');

          if (pice.after)
            result += ` ${arrow}`;
          else
            result = `${arrow} ${result}`;
        });

        return result;
      },

      // Упрощенный путь
      simplePath() {
        return this.track.path;
      },

      // Путь
      line() {
        return rounding(
          this.simplePath
            .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
          , TRACK_SMOOTHING);

      }
    },
    methods: {
      //
      onTrackClick() {
        this.$emit('track-click', this.track);
      },
      onTrackTitleClick() {
        this.$emit('track-title-click', this.track);
      },
      // Прокидываем события в диаграмму
      onTrackOver() {
        this.$emit('track-over', this.track);
      },
      onTrackLeave() {
        this.$emit('track-leave', this.track);
      },
      // Определяет стиль по совокупности признаков
      makeClass(isArrow) {
        const result = ['track'];
        // Определяем нужно ли подсвечивать путь
        if (this.track.highlight) result.push('track-highlight');
        // Анимируем если нужно
        if (!isArrow && this.track.animate) {
          const animation = this.makeAnimation();
          animation && result.push(animation);
        }
        return result.join(' ');
      },
      // Определяет классы анимации
      makeAnimation() {
        if ((this.startArrow === '>') && (this.endArrow === '<')) return 'track-animation-pull-push';
        if (this.startArrow === '>') return 'track-animation-pull';
        else if (this.endArrow === '<') return 'track-animation-push';
        return null;
      },
      // Генерирует path стрелки
      makeArrow(x, y, style, direction) {
        const shifts = {
          left: -2,
          right: 0,
          up: -1,
          down: -1
        };
        switch(style) {
          case '*': return `M ${x+shifts[direction]}, ${y} m 3, 0 a 2,2 0 1,0 -4,0 a 2,2 0 1,0  4,0`;
          case '>':
          case '<':
            switch (direction) {
              case 'up':
                return `M ${x - ARROW_WIDTH} ${y + ARROW_HEIGHT} L ${x} ${y} L ${x + ARROW_WIDTH} ${y + ARROW_HEIGHT}`;
              case 'down':
                return `M ${x - ARROW_WIDTH} ${y - ARROW_HEIGHT} L ${x} ${y} L ${x + ARROW_WIDTH} ${y - ARROW_HEIGHT}`;
              case 'left':
                return `M ${x - ARROW_HEIGHT} ${y - ARROW_WIDTH} L ${x} ${y} L ${x - ARROW_HEIGHT} ${y + ARROW_WIDTH}`;
              case 'right':
                return `M ${x + ARROW_HEIGHT} ${y - ARROW_WIDTH} L ${x} ${y} L ${x + ARROW_HEIGHT} ${y + ARROW_WIDTH}`;
              default:
                throw `Неизвестное направление стрелки ${direction} для связи ${this.track.id}`;
            }
          case '-': return '';
          default:
            throw `Неизвестный тип стрелки ${style} для связи ${this.track.id}`;
        }
      }
    }
  };

</script>

<style scoped>

* {
  transition: all 0.15s ease-in;
}

.track {
  cursor: crosshair;
  stroke: rgb(52, 149, 219);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  fill: none;
}

.track-title {
  stroke: rgba(0,0,0,.6);
  stroke-width: 0px;
  font-size: 12px;
}

.track-animation-pull {
  stroke-dasharray: 10;
  stroke-dashoffset: 0;
  animation: pull 1s linear;
  animation-iteration-count: infinite;
}

.track-animation-push {
  stroke-dasharray: 10;
  stroke-dashoffset: 80;
  animation: push 1s linear;
  animation-iteration-count: infinite;
}

.track-animation-pull-push {
  stroke-dasharray: 10;
  stroke-dashoffset: 80;
  animation: push 1s linear;
  animation-direction: alternate-reverse;
  animation-iteration-count: infinite;
}


@keyframes pull {
  to {
    stroke-dashoffset: 80;
  }
}

@keyframes push {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes pull-push {
  to {
    stroke-dashoffset: 0;
  }
}


/* Стили треков */
.track-highlight {
  stroke: #ff0000;
  z-index: 10000;
}

.title-highlight {
  z-index: 10000;
}

.title-link {
  cursor: pointer;
}

</style>
