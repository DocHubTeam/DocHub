<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-data-table
          v-bind:items="searchResults"
          v-bind:headers="headers"
          v-bind:loading="loading"
          v-bind:sort-by="['score']"
          v-bind:sort-desc="[true]"
          disable-pagination
          hide-default-footer
          class="elevation-1">
          
          <!-- Score header with info icon -->
          <template #[`header.score`]>
            <div class="score-header grey--text text--darken-1">
              Релевантность
              <v-tooltip bottom>
                <template #activator="tooltip">
                  <v-icon
                    small
                    class="info-icon"
                    color="grey lighten-1"
                    v-bind="tooltip.attrs"
                    v-on="tooltip.on">
                    mdi-information
                  </v-icon>
                </template>
                <span>
                  Релевантность результата поиска:<br>
                  • Точное совпадение в заголовке: 10 баллов<br>
                  • Совпадение в подзаголовках: 5 баллов каждое<br>
                  • Совпадение в ключевых словах: 3 балла<br>
                  • Совпадение в тексте: 1 балл за каждое<br><br>
                  Компоненты и аспекты: фиксированные 5 баллов
                </span>
              </v-tooltip>
            </div>
          </template>

          <!-- Entity column -->
          <template #[`item.entity`]="{ item }">
            <v-chip
              small
              v-bind:color="getEntityColor(item.entity)"
              text-color="white">
              {{ getEntityLabel(item.entity) }}
            </v-chip>
          </template>

          <!-- Title column with content preview -->
          <template #[`item.title`]="{ item }">
            <div class="search-result-item">
              <div class="d-flex align-center">
                <router-link 
                  v-if="item.link" 
                  v-bind:to="item.link"
                  v-on:click.native="navigateToItem(item)">
                  {{ item.title }}
                </router-link>
                <template v-else>{{ item.title }}</template>
              </div>

              <template v-if="item.matchedInContent">
                <div class="content-match mt-2">
                  <v-chip
                    x-small
                    label
                    color="blue-grey lighten-5"
                    class="mb-1">
                    {{ matchedInContentText }}
                  </v-chip>
                  
                  <div 
                    class="content-snippet grey--text text--darken-1"
                    v-html="highlightMatches(item.contentSnippet)">
                  </div>

                  <div v-if="item.matchedHeaders && item.matchedHeaders.length" class="matched-headers mt-1">
                    <v-chip
                      x-small
                      label
                      v-for="header in item.matchedHeaders"
                      v-bind:key="header"
                      class="mr-1 mb-1"
                      color="grey lighten-4">
                      {{ header }}
                    </v-chip>
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- Score column -->
          <template #[`item.score`]="{ item }">
            <span class="grey--text text--darken-1">{{ item.score }}</span>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <template v-if="searchResults.length === 0 && !loading">
      <div class="text-center my-4">
        <v-icon large color="grey lighten-1">mdi-magnify-close</v-icon>
        <div class="text-h6 grey--text text--darken-1">
          {{ noResultsText }}
        </div>
      </div>
    </template>
  </v-container>
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
  */

  import query from '@front/manifest/query';

  export default {
    name: 'SearchResults',
    data() {
      return {
        loading: false,
        searchResults: [],
        headers: [
          {
            text: 'Тип',
            value: 'entity',
            width: '120px',
            class: 'grey--text text--darken-1'
          },
          {
            text: 'Заголовок',
            value: 'title',
            class: 'grey--text text--darken-1'
          },
          {
            text: 'Релевантность',
            value: 'score',
            width: '150px',
            sortable: true,
            class: 'grey--text text--darken-1'
          }
        ],
        entityLabels: {
          component: 'Компонент',
          aspect: 'Аспект',
          document: 'Документ'
        },
        noResultsText: 'Результаты не найдены',
        matchedInContentText: 'Найдено в содержимом',
        relevanceText: 'Релевантность',
        currentSearchTerm: ''
      };
    },
    watch: {
      '$route.query.q': {
        immediate: true,
        handler(newQuery) {
          if (newQuery) {
            this.currentSearchTerm = newQuery;
            this.performSearch(newQuery);
          } else {
            this.searchResults = [];
          }
        }
      }
    },
    methods: {
      async performSearch(searchQuery) {
        if (!searchQuery?.trim()) return;
        
        this.loading = true;
        this.searchResults = [];
        
        try {
          const results = await query.searchWithContent(searchQuery);
          if (this.$route.query.q === searchQuery) {
            this.searchResults = results.map(result => ({
              ...result,
              link: this.getEntityLink(result)
            }));
          }
        } catch (error) {
          console.error('Search error:', error);
          this.searchResults = [];
        } finally {
          this.loading = false;
        }
      },
      getEntityLink(result) {
        switch(result.entity) {
          case 'component':
            return `/entities/components/blank?dh-component-id=${result.id}`;
          case 'aspect':
            return `/entities/aspects/blank?dh-aspect-id=${result.id}`;
          case 'document':
            return `/docs/${result.id}`;
          default:
            return result.link || '';
        }
      },
      getEntityColor(entity) {
        const colors = {
          component: 'primary',
          aspect: 'success',
          document: 'info'
        };
        return colors[entity] || 'grey';
      },
      getEntityLabel(entity) {
        return this.entityLabels[entity] || entity;
      },
      highlightMatches(text) {
        if (!text || !this.currentSearchTerm) return text;
        
        const searchTerms = this.currentSearchTerm.toLowerCase().split(/\s+/);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
          const regex = new RegExp(`(${term})`, 'gi');
          highlightedText = highlightedText.replace(
            regex, 
            '<span class="highlight">$1</span>'
          );
        });
        
        return highlightedText;
      }
    }
  };
</script>

<style scoped>
  .v-data-table ::v-deep tbody tr:hover {
    background-color: #f5f5f5 !important;
  }

  .v-data-table ::v-deep a {
    text-decoration: none;
  }

  .search-result-item {
    max-width: 800px;
  }

  .content-snippet {
    font-size: 0.85em;
    line-height: 1.4;
    margin: 4px 0;
    white-space: pre-line;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .matched-headers {
    font-size: 0.85em;
  }

  ::v-deep .highlight {
    background-color: rgba(255, 213, 79, 0.4);
    padding: 0 2px;
    border-radius: 2px;
  }

  .content-match {
    background-color: #fafafa;
    padding: 8px;
    border-radius: 4px;
    margin-top: 4px;
  }

  .score-header {
    display: flex;
    align-items: center;
  }

  .info-icon {
    margin-left: 4px;
    opacity: 0.7;
    cursor: help;
  }

  .info-icon:hover {
    opacity: 1;
  }

  /* Add consistent table styling */
  .v-data-table ::v-deep th {
    font-weight: normal !important;
    color: rgba(0, 0, 0, 0.6) !important;
  }

  .v-data-table ::v-deep td {
    color: rgba(0, 0, 0, 0.6) !important;
  }
</style>
