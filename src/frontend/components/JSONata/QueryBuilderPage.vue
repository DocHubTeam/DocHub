<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <v-col cols="12">
        <v-card class="fill-height">
          <v-card-text class="pa-0">
            <query-builder 
              v-on:execute="handleQueryGenerated" 
              v-on:showMessage="showSnackbar" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Окно предпросмотра запроса -->
    <v-dialog
      v-model="showPreviewDialog"
      max-width="600px">
      <v-card>
        <v-card-title class="grey lighten-4">
          Сгенерированный запрос
          <v-spacer />
          <v-btn 
            icon 
            title="Копировать запрос"
            v-on:click="copyQuery">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-4">
          <pre class="query-preview">{{ generatedQuery }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            v-on:click="showPreviewDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="snackbar"
      v-bind:timeout="3000"
      v-bind:color="snackbarColor">
      {{ snackbarText }}
      <template #action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          v-on:click="snackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
  import QueryBuilder from './QueryBuilder.vue';
  import {UTF8ToBase64URL} from '@front/helpers/strings';

  export default {
    name: 'QueryBuilderPage',
    components: {
      QueryBuilder
    },
    data() {
      return {
        generatedQuery: '',
        showPreviewDialog: false,
        snackbar: false,
        snackbarText: '',
        snackbarColor: 'success'
      };
    },
    methods: {
      handleQueryGenerated(generatedQuery) {
        this.generatedQuery = generatedQuery;
        this.showPreviewDialog = true;
      },
    
      copyQuery() {
        navigator.clipboard.writeText(this.generatedQuery)
          .then(() => {
            this.showSnackbar('Запрос скопирован в буфер обмена');
          })
          .catch(err => {
            console.error('Не удалось скопировать текст: ', err);
            this.showSnackbar('Не удалось скопировать текст', 'error');
          });
      },
    
      showSnackbar(text, color = 'success') {
        this.snackbarText = text;
        this.snackbarColor = color;
        this.snackbar = true;
      },
    
      openDevTool() {
        // Кодируем запрос в base64 и открываем редактор JSONata
        const encodedQuery = UTF8ToBase64URL(this.generatedQuery || '');
        this.$router.push(`/devtool/selection:${encodedQuery}`);
      }
    }
  };
</script>

<style scoped>
.query-preview {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  color: #333;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
}
</style> 
