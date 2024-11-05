<template>
  <box style="overflow-x: auto;">
    <div v-html="svg" />
  </box>
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
      R.Piontik <r.piontik@mail.ru> - 2022
      Navasardyan Suren, Sber 2022
      Vladislav Markin, Sber 2023
  */

  import mermaid from 'mermaid';
  import mustache from 'mustache';
  import mindmap from '@mermaid-js/mermaid-mindmap';
  import crc16 from '@global/helpers/crc16';

  import requests from '@front/helpers/requests';
  import href from '@front/helpers/href';

  import DocMixin from './DocMixin';

  import {diagram} from  '@mermaid-js/mermaid-mindmap/dist/diagram-definition.ae1f7a29';
  import {diagram as timeline_diagram} from 'mermaid/dist/timeline-definition-732a2638';
  import {diagram as c4Diagram} from 'mermaid/dist/c4Diagram-817c8e44';
  import {diagram as classDiagram} from 'mermaid/dist/classDiagram-48ab76fb';
  import {diagram as classDiagram_v2} from 'mermaid/dist/classDiagram-v2-8ecb0bfc';
  import {diagram as erDiagram} from 'mermaid/dist/erDiagram-9cfc3649';
  import {diagram as flowchart} from 'mermaid/dist/flowchart-elk-definition-e097735e';
  import {diagram as flowDiagram} from 'mermaid/dist/flowDiagram-61eb444c';
  import {diagram as flowDiagram_v2} from 'mermaid/dist/flowDiagram-v2-2f8f667a';
  import {diagram as ganttDiagram} from 'mermaid/dist/ganttDiagram-db6931fb';
  import {diagram as gitGraphDiagram} from 'mermaid/dist/gitGraphDiagram-6b463803';
  import {diagram as infoDiagram} from 'mermaid/dist/infoDiagram-a336098b';
  import {diagram as journeyDiagram} from 'mermaid/dist/journeyDiagram-deae3313';
  import {diagram as mindmap_diagram} from 'mermaid/dist/mindmap-definition-617cf8dd';
  import {diagram as pieDiagram} from 'mermaid/dist/pieDiagram-a5166659';
  import {diagram as quadrantDiagram} from 'mermaid/dist/quadrantDiagram-6c355bbc';
  import {diagram as requirementDiagram} from 'mermaid/dist/requirementDiagram-4038b16c';
  import {diagram as sankeyDiagram} from 'mermaid/dist/sankeyDiagram-6db3d513';
  import {diagram as sequenceDiagram} from 'mermaid/dist/sequenceDiagram-465a088a';
  import {diagram as stateDiagram} from 'mermaid/dist/stateDiagram-b620d43f';
  import {diagram as stateDiagram_v2} from 'mermaid/dist/stateDiagram-v2-2671c3d1';
  import {diagram as xychartDiagram} from 'mermaid/dist/xychartDiagram-f746c04c';

  /*
  mermaid.initialize({
    startOnLoad:true
  });
  */


  /* костыль, но вебпак я не поборол.
  * динамически подгружаемые модули засовывает в чанки
  * а загружать чанки наши плагины не умеют
  * поэтому прописал нужные динамические jsники статически
  */
  function never_used() {
    // eslint-disable-next-line no-console
    console.log(diagram);
    // eslint-disable-next-line no-console
    console.log(timeline_diagram);
    // eslint-disable-next-line no-console
    console.log(c4Diagram);
    // eslint-disable-next-line no-console
    console.log(classDiagram);
    // eslint-disable-next-line no-console
    console.log(classDiagram_v2);
    // eslint-disable-next-line no-console
    console.log(erDiagram);
    // eslint-disable-next-line no-console
    console.log(flowchart);
    // eslint-disable-next-line no-console
    console.log(flowDiagram);
    // eslint-disable-next-line no-console
    console.log(flowDiagram_v2);
    // eslint-disable-next-line no-console
    console.log(ganttDiagram);
    // eslint-disable-next-line no-console
    console.log(gitGraphDiagram);
    // eslint-disable-next-line no-console
    console.log(infoDiagram);
    // eslint-disable-next-line no-console
    console.log(journeyDiagram);
    // eslint-disable-next-line no-console
    console.log(mindmap_diagram);
    // eslint-disable-next-line no-console
    console.log(pieDiagram);
    // eslint-disable-next-line no-console
    console.log(quadrantDiagram);
    // eslint-disable-next-line no-console
    console.log(requirementDiagram);
    // eslint-disable-next-line no-console
    console.log(sankeyDiagram);
    // eslint-disable-next-line no-console
    console.log(sequenceDiagram);
    // eslint-disable-next-line no-console
    console.log(stateDiagram);
    // eslint-disable-next-line no-console
    console.log(stateDiagram_v2);
    // eslint-disable-next-line no-console
    console.log(xychartDiagram);
  }

  export default {
    name: 'DocMermaid',
    mixins: [DocMixin],
    data() {
      return {
        svg: null
      };
    },
    mounted() {
      if (!window.as_mindmap) {
        mermaid.registerExternalDiagrams([mindmap]).then(() => {
          window.as_mindmap = true;
        });
      }
    },
    methods: {
      load_all_dependencies() {
        never_used();
      },
      refresh() {
        // Получаем шаблон документа
        this.sourceRefresh().then(() => {
          requests.request(this.url).then(({ data }) => {
            const id = crc16(data);
            let source = this.isTemplate
              ? mustache.render(data, this.source.dataset)
              : data;
            const cb = (svgGraph) => {
              // Генерируем ссылки т.к. Mermaid для C4 Model отказывается это делать сам
              // eslint-disable-next-line no-useless-escape
              this.svg = svgGraph.replace(/\!\[([^\]]*)\]\(([^\)]*)\)/g, (match, text, url)=> {
                return `<a href="${encodeURI(url)}">${text}<a>`;
              })
                + `<!-- ${Date.now()} -->`; // Без соли не работает ререндеринг тех же данных

              this.$nextTick(() => href.elProcessing(this.$el));
            };
            const drawDiagram = async function() {
              const { svg } = await mermaid.render(`buffer${id}`, source);
              cb(svg);
            };
            drawDiagram();
          }).catch((e) => this.error = e);
        });
      }
    }
  };
</script>

<style>
</style>
