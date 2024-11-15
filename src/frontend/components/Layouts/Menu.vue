<template>
  <v-list dense class="grey lighten-4">
    <errexp v-if="error" v-bind:error="error" v-bind:query="queryCodeForError" />
    <v-list-item>
      <v-text-field 
        dense 
        clearable 
        v-model="searchQuery"
        v-on:keyup.enter="onSearch"
        v-on:click:append="onSearch"
        placeholder="Поиск..."
        v-on:input="onSearchInput">
        <v-icon slot="append">
          mdi-magnify
        </v-icon>
      </v-text-field>
    </v-list-item>
    <template v-for="(item, i) in menu">
      <v-list-item
        v-if="(item.route !== '/problems') || (problems.length)"
        v-bind:key="i"
        v-bind:class="{ 'menu-item': true, 'menu-item-selected': isMenuItemSelected(item) }"
        v-bind:style="{ 'padding-left': '' + (item.level * 8) + 'px' }">
        <v-list-item-action class="menu-item-action">
          <v-icon v-if="item.isGroup" v-on:click="onClickMenuExpand(item)">
            <template v-if="isExpandItem(item)">expand_more</template>
            <template v-else>chevron_right</template>
          </v-icon>
        </v-list-item-action>
        <v-subheader
          v-if="item.route === '/problems'"
          class="menu-item-header error--text"
          v-on:click="onClickMenuItem(item)">
          {{ item.title }} ({{ problemsCount }})
        </v-subheader>
        <v-subheader v-else class="menu-item-header" v-on:click="onClickMenuItem(item)">
          {{ item.title }}
        </v-subheader>
        <v-list-item-action v-if="item.icon" class="menu-item-action menu-item-ico">
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
      </v-list-item>
    </template>
  </v-list>
</template>

<script>
  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

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
      R.Piontik <r.piontik@mail.ru>
      Rostislav Kabalin <kabalin2009@yandex.ru>
  */

  import uri from '@front/helpers/uri';
  import query from '@front/manifest/query';
  import errexp from '@front/components/JSONata/JSONataErrorExplainer.vue';

  export default {
    name: 'Menu',
    components: {
      errexp
    },
    data() {
      return {
        currentRoute: this.$router.currentRoute,
        error: null,
        searchQuery: '',
        menuCache: null,
        expands: {
          architect: true,
          docs: true
        }
      };
    },
    asyncComputed: {
      async treeMenu() {
        const result = { items: {} };
        try {
          const dataset = (this.menuCache ? this.menuCache : await query.expression(query.menu()).evaluate()) || [];
          !this.menuCache && this.$nextTick(() => this.menuCache = dataset);

          dataset.map((item) => {
            const location = item.location.split('/');
            let node = result;
            let key = null;
            for (let i = 0; i < location.length; i++) {
              key = location[i];
              !node.items[key] && (node.items[key] = { title: key, items: {} });
              node = node.items[key];
            }
            node.title = item.title;
            node.route = item.route;
            node.icon = item.icon;
            if ((node.route === this.currentRoute.fullPath) || (node.route === this.currentRoute.path)) {
              this.$nextTick(() => {
                let subLocation = null;
                location.map((item) => {
                  subLocation = subLocation ? `${subLocation}/${item}` : item;
                  if (!this.expands[subLocation])
                    this.$set(this.expands, subLocation, true);
                });
              });
            }
          });
          this.error = null;
        } catch (err) {
          this.error = err;
        }
        return result;
      }
    },
    computed: {
      queryCodeForError() {
        return query.menu();
      },
      problemsCount() {
        let result = 0;
        this.problems.map((validator) => {
          (validator.items || []).map((problem) =>
            !problem.exception && result++
          );
        });
        return result;
      },
      problems() {
        return this.$store.state.problems || [];
      },
      menu() {
        const result = [];
        const expand = (node, location) => {
          for (const key in node.items) {
            const item = node.items[key];
            const itemLocation = (location || []).concat([key]);
            const menuItem = {
              title: item.title,
              route: item.route,
              icon: item.icon,
              level: itemLocation.length - 1,
              location: itemLocation.join('/')
            };

            result.push(menuItem);

            if (Object.keys(item.items).length) {
              menuItem.isGroup = true;
              if (this.expands[menuItem.location]) {
                expand(item, itemLocation);
              }
            }
          }
        };

        this.treeMenu && expand(this.treeMenu);
        return result;
      }
    },
    watch: {
      manifest() {
        this.menuCache = null;
      },
      $route(to) {
        this.currentRoute = to;
      }
    },
    methods: {
      onSearch() {
        console.log('Search triggered with query:', this.searchQuery);
        if (this.searchQuery) {
          this.$router.push({
            name: 'search',
            query: { q: this.searchQuery }
          });
        }
      },
      onSearchInput(value) {
        console.log('Search input changed:', value);
      },
      isExpandItem(item) {
        return this.expands[item.location];
      },
      isMenuItemSelected(item) {
        return (item.route === this.currentRoute.fullPath) || (item.route === this.currentRoute.path);
      },
      onClickMenuExpand(item) {
        this.$set(this.expands, item.location, !this.expands[item.location]);
      },
      onClickMenuItem(item) {
        if (item.route)
          if (uri.isExternalURI(item.route)) {
            window.open(item.route, '_blank');
          } else {
            this.$router.push({ path: item.route }).catch(() => null);
          }
        else
          this.onClickMenuExpand(item);
      }
    }
  };
</script>

<style scoped>
.menu-item {
  min-height: 20px !important;
  margin-top: 2px;
  margin-bottom: 2px;
}

.menu-item-action {
  padding: 0;
  margin: 2px !important;
}

.menu-item-header {
  line-height: 14px;
  height: auto !important;
  min-height: 32px;
  cursor: pointer;
}

.menu-item-ico {
  position: absolute;
  right: 4px;
}

.menu-item-selected {
  background: rgb(52, 149, 219);
}

.menu-item-selected * {
  color: #fff !important;
}
</style>
