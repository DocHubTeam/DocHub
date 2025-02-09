<template>
  <g>
    <g
      v-for="box in layer.boxes"
      v-bind:key="box.node.id">
      <g v-if="isArea(box)">
        <rect
          v-if="isArea(box)"
          class="box"
          v-bind:x="box.absoluteX"
          v-bind:y="box.absoluteY"
          v-bind:width="box.width"
          v-bind:height="box.height" />
      </g>
      <g v-else>
        <rect
          class="node"
          v-bind:x="box.absoluteX"
          v-bind:y="box.absoluteY"
          v-bind:width="box.width"
          v-bind:height="box.height" />
      </g>
      <schema-debug-node
        v-bind:offset-x="box.x"
        v-bind:offset-y="box.y"
        v-bind:layer="box.node" />
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
  */

  const SchemaDebugNode = {
    name: 'DHSchemaDebugNode',
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
      }
    },
    data() {
      return {
      };
    },
    methods: {
      isArea(item) {
        return item.node.subitems && Object.keys(item.node.subitems).length;
      }
    }
  };

  SchemaDebugNode.components = {
    SchemaDebugNode
  };

  export default SchemaDebugNode;
</script>

<style scoped>
.box {
  stroke: rgba(0,0,0,.4);
  fill: none;
}

.node {
  stroke: rgba(255,0,0,.6);
  fill: none;
}

</style>
