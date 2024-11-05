<template>
  <box>
    <v-card>
      <v-card-title v-if="(source.dataset || []).length > 10 && !isPrintVersion">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Поиск"
          single-line
          hide-details />
      </v-card-title>
      <v-data-table
        v-bind:mobile-breakpoint="0"
        v-bind:headers="headers"
        v-bind:items="source.dataset || []"
        v-bind:search="search"
        v-bind:items-per-page="itemsPerPage"
        v-bind:multi-sort="true"
        v-bind:hide-default-footer="isPrintVersion"
        v-bind:disable-pagination="isPrintVersion"
        v-bind:footer-props="footerProps"
        class="elevation-1">
        <!-- eslint-disable vue/valid-v-slot -->
        <template #footer.prepend>
          <v-btn icon colo1r="primary" v-on:click="exportToExcel">
            <v-icon title="Экспорт в Excel">mdi-export</v-icon>
          </v-btn>
          Экспорт в Excel
        </template>
        <template #item="{ item }">
          <tr>
            <td
              v-for="(field, index) in rowFields(item)"
              v-bind:key="index"
              v-bind:align="field.align">
              <template v-if="field.link">
                <d-c-link v-bind:href="field.link">{{ field.value }}</d-c-link>
              </template>
              <template v-else>{{ field.value }}</template>
            </td>
          </tr>
        </template>
        <template #no-data>
          <v-alert v-if="isReady" v-bind:value="true" icon="warning">
            Данных нет :(
          </v-alert>
          <v-alert v-else v-bind:value="true">
            Тружусь...
          </v-alert>
        </template>
      </v-data-table>
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
      R.Piontik <r.piontik@mail.ru> - 2022
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Vladislav Markin, Sber - 2023
      Vladislav Nefedov, Sber - 2023
      Vladislav Nefedov, Sber - 2024
  */

  import DCLink from '@front/components/Controls/DCLink.vue';
  import env from '@front/helpers/env';

  import DocMixin from './DocMixin';

  export default {
    name: 'DocTable',
    components: {
      DCLink
    },
    mixins: [DocMixin],
    props: {
      document: { type: String, default: '' }
    },
    data() {
      return {
        search: '',
        isReady: false
      };
    },
    computed: {
      headers() {
        return this.profile?.headers || [];
      },
      perPage() {
        return (this.profile || {})['per-page'];
      },
      isTemplate() {
        return true;
      },
      itemsPerPage() {
        return Math.max(
          Math.round(
            (Math.max(window.document.body?.scrollHeight || 0, window.document.body?.offsetHeight || 0) - 240)
              / 48), 5);
      },
      footerProps() {
        let lengthOtions = Array.from(
          new Set(
            [5, 10, 15, 20, this.source.dataset?.length]
          )
        );
        const itemsPerPageOptions = lengthOtions
          .sort((a, b) => a - b)
          .filter(v => v <= this.source.dataset?.length);

        return {'items-per-page-options': itemsPerPageOptions};
      }
    },
    methods: {
      refresh() {
        this.sourceRefresh().finally(() => this.isReady = true);
      },
      exportToExcel() {
        const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>'
              , base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))); }
              , format = function(s, c) {
                return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; });
              },
              htmlEscape = function(str) {
                return String(str)
                  .replace(/&/g, '&amp;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\n/g, '<br>');
              },
              ctx = {
                worksheet: this.document || 'Worksheet',
                table:
                  '<tr>' + this.headers.map((header) => `<td>${header.text}</td>`).join('') + '</tr>'
                  + (this.source.dataset || []).map((row) => {
                    return '<tr>' +
                      this.rowFields(row).map((cell) => {
                        return `<td>${htmlEscape(cell.value)}</td>`;
                      }).join('')
                      + '</tr>';
                  }).join('')
              };

        if (env.isPlugin()) {
          window.$PAPI.download(
            format(template, ctx),
            'Экспорт в Excel',
            'Выберите файл для сохранения выгрузки',
            'xls'
          );
        } else {
          const link = document.createElement('a');
          link.download = `${this.document}.xls`;
          link.href = 'data:application/vnd.ms-excel;base64,' + base64(format(template, ctx));
          link.click();
        }
      },
      rowFields(row) {
        const result = this.headers.map((column) => {
          return {
            value: (row[column.value] || '').toString().replace('\\n','\n'),
            link: column.link ? row[column.link] : undefined,
            align: column.align || 'left'
          };
        });
        return result;
      }
    }

  };
</script>

<style scoped>
table {
  max-width: 100%;
}
td {
  white-space: pre-wrap
}
</style>

<style>
.v-data-table-header tr th {
  white-space: nowrap;
}
</style>
