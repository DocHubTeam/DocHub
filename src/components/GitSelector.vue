<template>
  <v-autocomplete
      v-model="path"
      :items="items"
      chips
      multiple
      hide-no-data
      hide-selected
      item-text="name"
      item-value="uri"
      :label="parsedURI.file"
      placeholder="Выбери из списка размещение"
      prepend-icon="mdi-source-repository"
      return-object
  >
    <template v-slot:selection="data">
      <v-chip
          v-bind="data.attrs"
          close
          @click:close="remove(data.item)"
      >
        <v-avatar left>
          <v-icon>{{ getIcon(data.item) }}</v-icon>
        </v-avatar>
        {{ data.item.name }}
      </v-chip>
    </template>
    <template v-slot:item="data">
      <v-list-item-avatar>
        <v-icon>{{ getIcon(data.item) }}</v-icon>
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title>{{ data.item.list_title }}</v-list-item-title>
      </v-list-item-content>
    </template>
  </v-autocomplete>
</template>

<script>
import GitHelper from "../helpers/gitlab";

const axios = require('axios');

const PATH_TYPE_PROJECT = 'PROJECT';
const PATH_TYPE_BRANCH = 'BRANCH';
const PATH_TYPE_COMMIT = 'COMMIT';

const PATH_INDEX_PROJECT = 0;
const PATH_INDEX_BRANCH = 1;
const PATH_INDEX_COMMIT = 2;

export default {
  name: 'Catalog',
  mounted() {
    this.rebuildValueToPath();
  },
  watch: {
    path(value) {
      let emit_result = null;
      switch (value.length) {
        case PATH_INDEX_PROJECT + 1:
          this.fetchBranches();
          break;
        case PATH_INDEX_BRANCH + 1:
          this.fetchCommits();
          emit_result = GitHelper.makeFileURI(
              this.path[PATH_INDEX_PROJECT].id,
              this.parsedURI.file,
              this.path[PATH_INDEX_BRANCH].id,
              'raw'
          ).toString();
          break;
        case PATH_INDEX_COMMIT + 1:
          emit_result = GitHelper.makeFileURI(
              this.path[PATH_INDEX_PROJECT].id,
              this.parsedURI.file,
              this.path[PATH_INDEX_COMMIT].id,
              'raw'
          ).toString();
          break;
      }
      if (this.value !== emit_result) {
        this.$emit('input', emit_result);
      }
    }
  },
  methods: {
    remove(item) {
      switch (item.type) {
        case PATH_TYPE_PROJECT:
          this.path = [];
          break;
        case PATH_TYPE_BRANCH:
          this.path = this.path.slice(0, PATH_INDEX_BRANCH);
          break;
        case PATH_TYPE_COMMIT:
          this.path = this.path.slice(0, PATH_INDEX_COMMIT);
          break;
      }
    },

    rebuildValueToPath() {
      let path = [];
      if (this.parsedURI.project) {
        let project = this.resolveProjectByID(this.parsedURI.project);
        path.push({
          type: PATH_TYPE_PROJECT,
          id: this.parsedURI.project,
          name: project ? project.name : this.parsedURI.project,
          uri: `${PATH_TYPE_PROJECT}/${this.parsedURI.project}`
        });

        if (this.parsedURI.branch) {
          path.push({
            type: PATH_TYPE_BRANCH,
            id: this.parsedURI.branch,
            name: this.parsedURI.branch,
            uri: `${PATH_TYPE_BRANCH}/${this.parsedURI.branch}`
          });
        }
      }
      this.path = path;
    },

    fetchBranches() {
      this.branches = [];
      let feetch = (page) => {
        axios({
          method: 'get',
          url: GitHelper.branchesListURI(
              this.path[PATH_INDEX_PROJECT].id,
              page
          ),
          headers: {'Authorization': `Bearer ${this.$store.state.access_token}`}
        })
            .then((response) => {
              response.data.map((item) => {
                this.branches.push({
                  type: PATH_TYPE_BRANCH,
                  name: item.name,
                  id: item.name,
                  list_title: item.name,
                  uri: `${this.path[PATH_INDEX_PROJECT].name}/${item.name}`
                });
              });
              let next_page = response.headers['x-next-page'];
              if (next_page)
                feetch(next_page);
              else
                this.branches.sort();
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.error(error);
            });
      };
      feetch(1);
    },

    fetchCommits() {
      this.commits = [];
      let feetch = (page) => {
        axios({
          method: 'get',
          url: GitHelper.commitsListURI(
              this.path[PATH_INDEX_PROJECT].id,
              this.path[PATH_INDEX_BRANCH].name,
              page,
              this.parsedURI.file
          ),
          headers: {'Authorization': `Bearer ${this.$store.state.access_token}`}
        })
            .then((response) => {
              response.data.map((item) => {
                this.commits.push({
                  type: PATH_TYPE_COMMIT,
                  name: item.short_id,
                  list_title: `${item.short_id} [${item.title}]`,
                  id: item.id,
                  uri: `${this.path[PATH_INDEX_PROJECT].name}/${item.id}`
                });
              });
              let next_page = response.headers['x-next-page'];
              if (next_page)
                feetch(next_page);
              else
                this.branches.sort();
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.error(error);
            });
      };
      feetch(1);
    },

    getIcon(item) {
      switch (item.type) {
        case PATH_TYPE_PROJECT:
          return 'mdi-database'
        case PATH_TYPE_BRANCH:
          return 'mdi-source-branch';
        case PATH_TYPE_COMMIT:
          return 'mdi-source-commit';
        default:
          return '';
      }
    },

    resolveProjectByID(project_id) {
      for (let index in this.$store.state.available_projects) {
        let project = this.$store.state.available_projects[index];
        if (project.id === project_id) {
          return project;
        }
      }
      return null;
    }
  },
  computed: {
    projects() {
      let result = [];
      for (let key in this.$store.state.docs) {
        let doc = this.$store.state.docs[key];
        if (doc.transport.toLowerCase() === 'gitlab') {
          let project = this.resolveProjectByID(doc.project_id);
          if (project) {
            result.push({
              type: PATH_TYPE_PROJECT,
              id: project.id,
              name: project.name,
              list_title: project.name,
              uri: `${PATH_TYPE_PROJECT}/${project.id}`
            });
          }
        }
      }
      return result;
    },

    items() {
      let result = [].concat(this.path);
      switch (this.path.length) {
        case 0:
          result = result.concat(this.projects);
          break;
        case 1:
          result = result.concat(this.branches);
          break;
        case 2:
          result = result.concat(this.commits);
          break;
      }
      return result;
    },

    parsedURI() {
      return GitHelper.parseURI(this.baseUri);
    }
  },
  props: {
    value: String,
    baseUri: String,
  },
  data() {
    return {
      commits: [],
      branches: [],
      path: [],
    };
  }
};
</script>

<style>
</style>
