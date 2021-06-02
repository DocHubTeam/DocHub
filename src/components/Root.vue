<template>
  <VApp id="keep">
    <VAppBar
      app
      clipped-left
      color="#3495db"
      dark
    >
      <VAppBarNavIcon @click="drawer = !drawer">
        <div
          style="padding:4px; background: #fff; border-radius: 17px;"
        >
          <svg
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="background: #fff; border-radius: 3px;"
          >
            <path
              d="M14.5264 23.5895C19.2934 23.5895 23.1579 19.725 23.1579 14.9579C23.1579 10.1908 19.2934 6.32629 14.5264 6.32629C9.75927 6.32629 5.89478 10.1908 5.89478 14.9579C5.89478 19.725 9.75927 23.5895 14.5264 23.5895Z"
              fill="#3495DB"
            />
            <path
              opacity="0.9"
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M9.05263 18.1053C14.0523 18.1053 18.1053 14.0523 18.1053 9.05263C18.1053 4.053 14.0523 0 9.05263 0C4.053 0 0 4.053 0 9.05263C0 14.0523 4.053 18.1053 9.05263 18.1053ZM9.05263 15.7035C12.7259 15.7035 15.7035 12.7259 15.7035 9.05263C15.7035 5.37945 12.7259 2.40172 9.05263 2.40172C5.37945 2.40172 2.40172 5.37945 2.40172 9.05263C2.40172 12.7259 5.37945 15.7035 9.05263 15.7035Z"
              fill="#081935"
            />
          </svg>
        </div>
      </VAppBarNavIcon>
      <VToolbarTitle
        style="cursor: pointer"
        @click="$router.push({name: 'main'})"
      >
        DocHub
      </VToolbarTitle>
      <VSpacer />
      <VBtn
        icon
        title="Стравнить"
        @click="goDiffView"
      >
        <VIcon>mdi-call-split</VIcon>
      </VBtn>
      <!--
            <v-text-field
                    solo-inverted
                    flat
                    hide-details
                    label="Search"
                    prepend-inner-icon="search"
            />
            -->
    </VAppBar>

    <VNavigationDrawer
      v-model="drawer"
      app
      clipped
      color="grey lighten-4"
    >
      <VList
        dense
        class="grey lighten-4"
      >
        <template v-for="(item, i) in items">
          <template v-if="isMenuAvailable(item)">
            <VListItem
              v-if="!item.isNode"
              :key="i"
              :style="{'padding-left': '' + (item.level * 8) + 'px'}"
            >
              <VListItemAction>
                <VIcon v-if="item.level == 0">
                  home
                </VIcon>
                <VIcon v-else>
                  folder_open
                </VIcon>
              </VListItemAction>
              <VSubheader>
                {{ item.title }}
              </VSubheader>
            </VListItem>
            <VDivider
              v-else-if="item.divider"
              :key="i"
              dark
              class="my-4"
            />
            <VListItem
              v-else
              :key="i"
              link
              :class="isItemSelected(item) ? ['v-item--active', 'v-list-item--active'] : []"
              @click="onClickMenuItem(item)"
            >
              <VListItemAction>
                <VIcon>{{ item.icon }}</VIcon>
              </VListItemAction>
              <VListItemContent>
                <VListItemTitle>
                  {{ item.title }}
                </VListItemTitle>
              </VListItemContent>
            </VListItem>
          </template>
        </template>
      </VList>
    </VNavigationDrawer>
    <VContent>
      <RouterView />
    </VContent>
  </VApp>
</template>

<script>
    import config from '../config';
    import consts from '../consts'

    export default {
        name: 'Root',
        data() {
            return {
                drawer: null,
            };
        },
        computed: {
            available_projects() {
                return this.$store.state.available_projects;
            },
            // Available documentation items
            items() {
                return this.expandMenuTree(
                    this.buildMenuTree(config.root_manifest)
                );
            },
        },
        methods: {
            goDiffView() {
                this.$router.push({
                    name: 'conditions',
                    params: {
                        source: btoa(this.$store.state.selected_doc.uri),
                        target: btoa(null)
                    }
                });
            },

            isItemSelected(item) {
                let selected_doc = this.$store.state.selected_doc;
                return selected_doc && selected_doc.uri && selected_doc.uri.toString() === item.data.uri.toString();
            },

            onClickMenuItem(item) {
                this.$store.dispatch('selectDocument', item.data);
                this.$router.push({
                    name: 'swagger',
                    params: {
                        source: btoa(item.data.uri)
                    }
                });
            },
            isMenuAvailable(item) {
                return item.transport != consts.transports.GITLAB ||
                        !!this.available_projects[item.project_id]
            },
            // Build menu's tree by manifest
            buildMenuTree(manifest) {
                let tree = {};
                const project_id = manifest.project_id;
                const docs = this.$store.state.docs;
                for (let id in docs) {
                    const item = docs[id];
                    // Parsing location to tree
                    let node = tree;
                    item.location.split('/').map((part, index) => {
                        if (!(part in node)) {
                            node[part] = {
                                level: index,
                                title: part
                            };
                        }
                        node = node[part];
                    });

                    if (node.isNode) {
                        // eslint-disable-next-line no-console
                        console.error(`Duplicate node location ${item.location} for project ${project_id}`);
                        break;
                    }

                    node.isNode = true;
                    node.icon = 'icon' in item ? item.icon : 'settings';
                    node.description = 'description' in item ? item.description : '';
                    node.data = item;
                }
                return tree;
            },
            // Expand menu's tree to menu's list
            expandMenuTree(tree) {
                let result = [];
                const expand = (node) => {
                    for (let key in node) {
                        const subnode = node[key];
                        if ((typeof subnode == 'object') && ('level' in subnode)) {
                            result.push(subnode);
                            if (!subnode.isNode) {
                                expand(subnode);
                            }
                        }
                    }
                }
                expand(tree);
                return result;
            }
        }
    };
</script>

<style>
    @import '../assets/material_icons.css';
    @import '~vuetify/dist/vuetify.min.css';
    @import '~swagger-ui/dist/swagger-ui.css';

    .swagger-ui {
        width: 100%;
    }

</style>
