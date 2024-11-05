<template>
  <g>
    <g
      v-for="(box, idx) in layer.boxes"
      v-bind:key="box.node + idx">
      <g
        v-if="isArea(box)"
        v-on:dblclick.stop.prevent="onNodeDblClick(box, true)">
        <template v-if="isShowArea">
          <rect
            v-if="isArea(box) && !box.node.hideBorder"
            class="box"
            v-bind:fill="`${box.node.background || '#fff'}`"
            v-bind:fill-opacity="`${ box.node.background ? (box.node.opacity || 1) : 0}`"
            v-bind:x="box.absoluteX"
            v-bind:y="box.absoluteY"
            v-bind:width="box.width"
            v-bind:height="box.height"
            rx="8" />
          <text
            v-if="!hideBoundaryTitles && !box.node.hideTitle"
            class="box-text"
            v-bind:x="box.absoluteX + 4"
            v-bind:y="box.absoluteY + 16">
            {{ box.node.title || box.node.id }}
          </text>
        </template>
      </g>
      <g v-if="(!isArea(box) && isShowNode) || !box.node?.symbol?.startsWith('$')">
        <use
          v-bind:key="box.node.id"
          v-bind:style="{ opacity: box.opacity }"
          v-bind:x="box.absoluteX"
          v-bind:y="box.absoluteY"
          v-bind:xlink:href="`#${box.node.symbol}`"
          v-on:mousedown.stop.prevent="onNodeClick(box, false)"
          v-on:dblclick.stop.prevent="onNodeDblClick(box, false)" />
        <text
          v-if="!isArea(box) && !hideLeafTitles && !box.node.hideTitle"
          v-bind:transform="`translate(${box.absoluteX},${box.absoluteY + box.height})`"
          class="node-text"
          v-bind:style="{ opacity: box.opacity }">
          <tspan
            v-for="(line, index) in textLines(box)"
            v-bind:key="index"
            v-bind:x="box.width * 0.5"
            v-bind:y="index * 12 + 16"
            text-anchor="middle">
            {{ line }}
          </tspan>
        </text>
      </g>
      <schema-node
        v-bind:offset-x="box.x"
        v-bind:offset-y="box.y"
        v-bind:layer="box.node"
        v-bind:mode="mode"
        v-bind:hide-boundary-titles="hideBoundaryTitles"
        v-bind:hide-leaf-titles="hideLeafTitles"
        v-on:node-dblclick="onNodeDblClick"
        v-on:node-click="onNodeClick" />
    </g>
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

  const CHAR_WIDTH = 5;

  export const SchemaNode = {
    name: 'DHSchemaNode',
    props: {
      offsetX: {
        type: Number,
        required: true
      },
      offsetY: {
        type: Number,
        required: true
      },
      layer: {
        type: Object,
        required: true
      },
      mode: {
        type: String,
        required: true,
        validator: (val) => ['area', 'node', 'all'].includes(val)
      },
      hideBoundaryTitles: {
        type: Boolean,
        required: false,
        default: false
      },
      hideLeafTitles: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    data() {
      return {
      };
    },
    computed: {
      isShowArea() {
        return this.mode === 'area' || this.mode === 'all';
      },
      isShowNode() {
        return this.mode === 'node' || this.mode === 'all';
      }
    },
    methods: {
      textLines(box) {
        const title = box.node.title || box.node.id || '';
        const result = [];
        let offset = 0;
        let length = 0;
        let line = null;
        // eslint-disable-next-line no-useless-escape
        title.split(/\s|\.|\,\;/).map((pice) => {
          const width = pice.length * CHAR_WIDTH + CHAR_WIDTH;
          const segment = title.slice(offset, offset + pice.length + 1);
          if ((length + width > box.width) && line) {
            result.push(line);
            length = 0;
            line = null;
          }
          offset += pice.length + 1;
          length += width;
          line = `${line || ''}${segment}`;
        });

        line && result.push(line);

        return result;
      },
      onNodeDblClick(box, isArea) {
        this.$emit('node-dblclick', box, isArea);
      },
      onNodeClick(box, isArea) {
        this.$emit('node-click', box, isArea);
      },
      classes() {
        const result = [];
        result.push('node-highlight');
        return result.join(' ');
      },
      isArea(item) {
        return item.node?.subitems && Object.keys(item.node?.subitems).length;
      }
    }
  };

  SchemaNode.components = {
    SchemaNode
  };

  export default SchemaNode;
</script>

<style scoped>
.box {
  stroke: rgba(0,0,0,.6);
  font-size: 12px;
}

.box:hover {
  stroke: rgba(255,0,0,.6);
  stroke-width: 5px;
}

* {
  transition: all 0.15s ease-in;
}

.node-text {
  font-size: 10px;
}

.box-text {
  font-size: 12px;
}

.node-highlight {
  stroke: #F00;
  opacity: 0.5;
}

</style>
