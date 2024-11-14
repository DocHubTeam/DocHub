<template>
  <v-container fluid>
    <!-- Results table -->
    <v-row>
      <v-col>
        <v-data-table
          v-bind:items="searchResults"
          v-bind:headers="headers"
          v-bind:loading="loading"
          v-bind:sort-by="['id']"
          v-bind:sort-desc="[false]"
          disable-pagination
          hide-default-footer
          class="elevation-1">
          <!-- Entity type column -->
          <template v-slot:[`item.entity`]="{ item }">
            <v-chip
              small
              v-bind:color="getEntityColor(item.entity)"
              text-color="white">
              {{ item.entity }}
            </v-chip>
          </template>
          
          <!-- Title/Link column -->
          <template v-slot:[`item.title`]="{ item }">
            <router-link 
              v-if="item.link" 
              v-bind:to="item.link">
              {{ item.title }}
            </router-link>
            <template v-else>{{ item.title }}</template>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- No results message -->
    <v-row v-if="!loading && searchResults.length === 0">
      <v-col class="text-center">
        <v-alert type="info" text>
          No results found
        </v-alert>
      </v-col>
    </v-row>
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
            text: 'Type',
            value: 'entity',
            width: '120px',
            sortable: false
          },
          { 
            text: 'ID',
            value: 'id',
            sortable: true
          },
          { 
            text: 'Title',
            value: 'title',
            sortable: true
          }
        ]
      };
    },
    watch: {
      '$route.query.q': {
        immediate: true,
        handler(newQuery) {
          if (newQuery) {
            this.performSearch(newQuery);
          } else {
            this.searchResults = [];
          }
        }
      }
    },
    methods: {
      async performSearch(searchQuery) {
        this.loading = true;
        this.searchResults = []; // Clear previous results
        
        try {
          console.log('Performing search for:', searchQuery);
          const searchExpression = query.search(searchQuery);
          console.log('Search expression:', searchExpression);
          
          const results = await query.expression(searchExpression).evaluate();
          console.log('Raw results:', results);
          
          // Handle both array and single object results
          if (results) {
            // Convert to array if single object
            const resultsArray = Array.isArray(results) ? results : [results];
            
            // Transform and filter out any null/undefined values
            this.searchResults = resultsArray
              .filter(item => item && item.id) // Only keep valid items
              .map(item => ({
                entity: String(item.entity || ''),
                id: String(item.id || ''),
                title: String(item.title || ''),
                link: String(item.link || '')
              }));
          }
          
          console.log('Processed search results:', this.searchResults);
        } catch (error) {
          console.error('Search error:', error);
          console.error('Error details:', error.stack);
          this.searchResults = [];
        } finally {
          this.loading = false;
        }
      },
      getEntityColor(entity) {
        const colors = {
          component: 'primary',
          aspect: 'success',
          document: 'info'
        };
        return colors[entity] || 'grey';
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
</style>
