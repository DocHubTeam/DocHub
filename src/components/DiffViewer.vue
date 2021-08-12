<template>
  <v-container
      fluid
      class="lighten-4 fill-height"
  >
    <div style="display: none" v-html="styles"></div>
    <template v-if="renderDiffView">
      <v-row>
        <v-col cols="2">
          <v-select
              v-model="outputFormat"
              :items="outputFormats"
              menu-props="auto"
              hide-details
              label="Представление "
              single-line
          ></v-select>
        </v-col>
        <v-col cols="8">
        </v-col>
      </v-row>
      <v-row>
        <template v-if="outputFormat === 'swagger-by-swagger'">
          <v-col cols="6" style="overflow-y: auto">
            <div
                class="swagger-view fill-height"
                id="swg-source"
            >Тружусь...
            </div>
          </v-col>
          <v-col cols="6" style="overflow-y: auto">
            <div
                class="swagger-view fill-height"
                id="swg-target"
            >Тружусь...
            </div>
          </v-col>
        </template>
        <v-col cols="12" v-else>
          <code-diff-viewer
              style="width: 100%"
              :new-string="sourceDoc"
              :old-string="targetDoc"
              :context="10"
              :output-format="outputFormat"
          />
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <v-row align="center">
        <v-col cols="12" align="center">
          Тружусь....
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import CodeDiffViewer from 'vue-code-diff';
import axios from 'axios';
import GitLabHelper from './../helpers/gitlab'
import SwaggerUI from "swagger-ui";

export default {
  name: 'Swagger',
  components: {
    CodeDiffViewer
  },
  created() {
    this.sourceURI = this.source ? atob(this.source) : null;
    this.targetURI = this.target ? atob(this.target) : null;
  },
  mounted() {
    this.render();
  },
  watch: {
    source() {
      this.render(['source']);
    },
    target() {
      this.render(['target']);
    },
  },
  methods: {
    render(mode) {
      if (this.outputFormat !== 'swagger-by-swagger') {
        if (!mode || (mode.indexOf('source') >= 0)) {
          if (this.sourceURI)
            this.downloadSource();
          else
            this.sourceDoc = null;
        }
        if (!mode || (mode.indexOf('target') >= 0)) {
          if (this.targetURI && this.targetURI.toUpperCase() !== 'NULL')
            this.downloadTarget();
          else
            this.targetDoc = null;
        }
      } else {
        if (!mode || (mode.indexOf('source') >= 0)) {
          this.swaggerRenderSource();
        }
        if (!mode || (mode.indexOf('target') >= 0)) {
          this.swaggerRenderTarget();
        }
      }
    },

    swaggerRequestInterceptor(request) {
      if (GitLabHelper.isGitLabURI(request.url)) {
        request.headers['Authorization'] = `Bearer ${this.$store.state.access_token}`;
      }
    },

    swaggerRenderSource() {
      SwaggerUI({
        dom_id: '#swg-source',
        url: this.sourceURI,
        requestInterceptor: this.swaggerRequestInterceptor,
        responseInterceptor: (response) => {
          this.sourceDoc = response.body;
        },
      });
    },

    swaggerRenderTarget() {
      SwaggerUI({
        dom_id: '#swg-target',
        url: this.targetURI,
        requestInterceptor: this.swaggerRequestInterceptor,
        responseInterceptor: (response) => {
          this.targetDoc = response.body;
        },
      });
    },

    downloadSource() {
      this.sourceDoc = null;
      axios({
        method: 'get',
        url: this.sourceURI,
        headers:
            GitLabHelper.isGitLabURI(this.sourceURI)
                ? {'Authorization': `Bearer ${this.$store.state.access_token}`} : {}
      })
          .then((response) => {
            this.sourceDoc = typeof response.data === 'object'
                ? JSON.stringify(response.data) : response.data;
          })
          .catch((error) => {
            alert(`Что-то пошло не так... возможно нет файла на целевом ресурсе [${this.sourceURI}]`);
            // eslint-disable-next-line no-console
            console.error(error);
          });
    },

    downloadTarget() {
      this.targetDoc = null;
      axios({
        method: 'get',
        url: this.targetURI,
        headers:
            GitLabHelper.isGitLabURI(this.targetURI)
                ? {'Authorization': `Bearer ${this.$store.state.access_token}`} : {}
      })
          .then((response) => {
            this.targetDoc = typeof response.data === 'object'
                ? JSON.stringify(response.data) : response.data;
          })
          .catch((error) => {
            alert(`Что-то пошло не так... возможно нет файла на целевом ресурсе [${this.targetURI}]`);
            // eslint-disable-next-line no-console
            console.error(error);
          });
    },

    deepCompareObjects(source, target) {
      return JSON.stringify(source) == JSON.stringify(target);
    },

    appendDiffOfMethods(diff) {
      //Detect deleted methods
      for (let path in this.sourceDoc.paths) {
        if (!(path in this.targetDoc.paths)) {
          for (let method in this.sourceDoc.paths[path]) {
            diff.deleted.push({
              class: 'opblock',
              id: this.sourceDoc.paths[path][method].operationId
            });
          }
        } else {
          for (let method in this.sourceDoc.paths[path]) {
            if (!(method in this.targetDoc.paths[path])) {
              diff.deleted.push({
                class: 'opblock',
                id: this.sourceDoc.paths[path][method].operationId
              });
            } else {
              if (!this.deepCompareObjects(
                  this.sourceDoc.paths[path][method],
                  this.targetDoc.paths[path][method]
              )) {
                diff.changed.push({
                  class: 'opblock',
                  id: this.targetDoc.paths[path][method].operationId
                });
              } else {
                diff.oks.push({
                  class: 'opblock',
                  id: this.targetDoc.paths[path][method].operationId
                });
              }
            }
          }
        }
      }

      //Detect added methods
      for (let path in this.targetDoc.paths) {
        if (!(path in this.sourceDoc.paths)) {
          for (let method in this.targetDoc.paths[path]) {
            diff.added.push({
              class: 'opblock',
              id: this.targetDoc.paths[path][method].operationId
            });
          }
        } else {
          for (let method in this.targetDoc.paths[path]) {
            if (!(method in this.sourceDoc.paths[path])) {
              diff.added.push({
                class: 'opblock',
                id: this.targetDoc.paths[path][method].operationId
              });
            }
          }
        }
      }
    },

    appendDiffOfSchemas(diff) {
      let sourceSchemas = this.sourceDoc.components.schemas;
      let targetSchemas = this.targetDoc.components.schemas;

      //Detect deleted schemas
      for (let schema in sourceSchemas) {
        if (!(schema in targetSchemas)) {
          diff.deleted.push({
            class: 'model-container',
            id: schema
          });
        } else {
          if (!this.deepCompareObjects(
              sourceSchemas[schema],
              targetSchemas[schema]
          )) {
            diff.changed.push({
              class: 'model-container',
              id: schema
            });
          } else {
            diff.oks.push({
              class: 'model-container',
              id: schema
            });
          }
        }
      }
      //Detect added schemas
      for (let schema in targetSchemas) {
        if (!(schema in sourceSchemas)) {
          diff.added.push({
            class: 'model-container',
            id: schema
          });
        }
      }
    }
  },
  computed: {
    outputFormat: {
      set(value) {
        this.$store.commit('setDiffFormat', value);
        if (value == 'swagger-by-swagger' || this.$store.state.diff_format == 'swagger-by-swagger') {
          this.targetDoc = null;
          this.sourceDoc = null;
        }
        this.$nextTick(() => this.render());
      },
      get() {
        return this.$store.state.diff_format;
      }
    },
    renderDiffView() {
      return (!!this.sourceDoc && !!this.targetDoc) || this.outputFormat == 'swagger-by-swagger';
    },

    swaggerDiffs() {
      let result = {
        deleted: [],
        added: [],
        changed: [],
        oks: []
      };

      if (!this.sourceDoc || !this.targetDoc || this.outputFormat !== 'swagger-by-swagger')
        return result;

      this.appendDiffOfMethods(result);
      this.appendDiffOfSchemas(result);

      return result;
    },

    styles() {
      const normalID = (id) => {
        return id.replace(/\\/g, "\\\\").replace(/:/g, '\\:');
      };

      let result = '<style>';

      //Added
      let added = [];
      this.swaggerDiffs.added.map(
          (item) => added.push(`#swg-target [id$=` + normalID(item.id) + `].${item.class}::before`)
      );
      if (added.length) {
        result += added.join(',') + `{
                        content: "\\F0416";
                        color: #49cc90;
                    }`;
      }

      //Deleted
      let deleted = [];
      this.swaggerDiffs.deleted.map(
          (item) => deleted.push(`#swg-source [id$=` + normalID(item.id) + `].${item.class}::before`)
      );
      if (deleted.length) {
        result += deleted.join(',') + `{
                        content: "\\F01B4";
                        color: #f93e3e;
                    }`;
      }

      //Changed
      let changed = [];
      this.swaggerDiffs.changed.map(
          (item) => changed.push(`[id$=` + normalID(item.id) + `].${item.class}::before`)
      );
      if (changed.length) {
        result += changed.join(',') + `{
                        content: "\\F03EB";
                        color: #fca130;
                    }`;
      }

      //Checked methods
      let oks = [];
      this.swaggerDiffs.oks.map(
          (item) => oks.push(` [id$=` + normalID(item.id) + `].${item.class}::before`)
      );
      if (oks.length) {
        result += oks.join(',') + `{
                        content: "\\F0E1E";
                        color: #61affe;
                    }`;
      }

      return `${result}</style>`;
    }
  },
  props: {
    source: String,
    target: String,
    mode: String
  },
  data() {
    return {
      sourceURI: null,
      targetURI: null,
      customTarget: null,
      targetBranch: null,
      sourceDoc: null,
      targetDoc: null,
      outputFormats: ["line-by-line", "side-by-side", "swagger-by-swagger"]
    };
  }
};
</script>

<style>

.v-application code {
  background-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
}

.opblock::before {
  position: absolute;
  margin-left: -26px;
  margin-top: 8px;
  font-size: 28px;
  font: normal normal normal 24px/1 "Material Design Icons";
}

.model-container::before {
  margin-top: 18px !important;
  margin-left: -22px !important;
  position: absolute;
  margin-left: -26px;
  margin-top: 8px;
  font-size: 28px;
  font: normal normal normal 24px/1 "Material Design Icons";
}

.swagger-view {
  width: 100%;
  position: relative;
}

</style>
