<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        Конструктор запросов
      </v-card-title>

      <v-card-text>
        <v-stepper v-model="step" class="elevation-0">
          <!-- Шаг 1: Выбор типа сущности -->
          <v-stepper-items>
            <v-stepper-content step="1">
              <v-card flat>
                <v-card-text>
                  <h3 class="mb-4 grey--text text--darken-1 font-weight-regular">Выберите тип сущности</h3>
                  <v-row v-if="isLoading">
                    <v-col cols="12" class="text-center">
                      <v-progress-circular indeterminate color="primary" size="64" width="5" />
                      <div class="mt-4 text-subtitle-1">Загрузка типов сущностей...</div>
                    </v-col>
                  </v-row>
                  <v-row v-else>
                    <v-col 
                      v-for="entity in entityTypes" 
                      v-bind:key="entity.type" 
                      cols="12"
                      md="4"
                      sm="6">
                      <v-card 
                        v-bind:color="selectedEntityType === entity.type ? 'grey lighten-4' : ''" 
                        class="pa-4 entity-card"
                        v-bind:class="{ 'selected': selectedEntityType === entity.type }"
                        hover
                        elevation="1"
                        v-on:click="selectEntityType(entity.type)">
                        <div class="d-flex align-center">
                          <v-avatar
                            size="42"
                            class="mr-4"
                            color="grey lighten-4">
                            <v-icon size="24" color="primary">{{ entity.icon }}</v-icon>
                          </v-avatar>
                          <div>
                            <div class="subtitle-1 font-weight-medium">{{ entity.label }}</div>
                            <div class="caption grey--text">{{ entity.description }}</div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    v-bind:disabled="!selectedEntityType"
                    v-on:click="step = 2"
                    text
                    class="px-4">
                    Далее
                    <v-icon right>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Шаг 2: Выбор полей для вывода -->
            <v-stepper-content step="2">
              <v-card flat>
                <v-card-text>
                  <h3 class="mb-4 primary--text">Выберите поля для вывода</h3>
                  <v-row v-if="isLoadingFields">
                    <v-col cols="12" class="text-center">
                      <v-progress-circular indeterminate color="primary" size="64" width="5" />
                      <div class="mt-4 text-subtitle-1">Загрузка полей сущности...</div>
                    </v-col>
                  </v-row>
                  <v-row v-else>
                    <v-col cols="12">
                      <v-alert
                        v-if="availableFields.length === 0"
                        type="info"
                        outlined
                        dense>
                        Не удалось определить поля для данного типа сущности. Попробуйте выбрать другой тип.
                      </v-alert>
                      
                      <template v-else>
                        <div class="field-actions d-flex align-center mb-3">
                          <div class="title primary--text mr-3">Поля</div>
                          <v-btn
                            small
                            outlined
                            color="primary"
                            class="mr-2"
                            v-on:click="selectAllFields(true)">
                            <v-icon small left>mdi-checkbox-marked-outline</v-icon>
                            Выбрать все
                          </v-btn>
                          <v-btn
                            small
                            outlined
                            color="grey darken-1"
                            v-on:click="selectAllFields(false)">
                            <v-icon small left>mdi-checkbox-blank-outline</v-icon>
                            Снять выбор
                          </v-btn>
                          
                          <v-spacer />
                          
                          <v-text-field
                            v-model="fieldSearch"
                            append-icon="mdi-magnify"
                            label="Поиск полей"
                            hide-details
                            dense
                            outlined
                            style="max-width: 250px"
                            clearable />
                        </div>
                        
                        <v-card class="field-selector pa-3 mb-4" outlined>
                          <!-- ID поле всегда первое и отдельно -->
                          <v-checkbox
                            v-model="selectedFields.id"
                            label="ID (идентификатор)"
                            hide-details
                            class="field-checkbox id-field"
                            color="primary" />
                            
                          <v-row>
                            <!-- Основные поля -->
                            <v-col cols="12" md="6">
                              <div class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="primary" class="mr-1">mdi-star</v-icon>
                                  Основные поля
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getPriorityFields())"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="primary" />
                                </div>
                              </div>
                              
                              <!-- Строковые поля -->
                              <div v-if="getFilteredFields(getFieldsByType('string')).length > 0" class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="blue" class="mr-1">mdi-text</v-icon>
                                  Текстовые поля
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getFieldsByType('string'))"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="blue" />
                                </div>
                              </div>
                              
                              <!-- Числовые поля -->
                              <div v-if="getFilteredFields(getFieldsByType('number')).length > 0" class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="green" class="mr-1">mdi-numeric</v-icon>
                                  Числовые поля
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getFieldsByType('number'))"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="green" />
                                </div>
                              </div>
                            </v-col>
                            
                            <v-col cols="12" md="6">
                              <!-- Логические поля -->
                              <div v-if="getFilteredFields(getFieldsByType('boolean')).length > 0" class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="purple" class="mr-1">mdi-toggle-switch</v-icon>
                                  Логические поля
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getFieldsByType('boolean'))"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="purple" />
                                </div>
                              </div>
                              
                              <!-- Массивы -->
                              <div v-if="getFilteredFields(getFieldsByType('array')).length > 0" class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="orange" class="mr-1">mdi-format-list-bulleted</v-icon>
                                  Массивы
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getFieldsByType('array'))"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="orange" />
                                </div>
                              </div>
                              
                              <!-- Объекты -->
                              <div v-if="getFilteredFields(getFieldsByType('object')).length > 0" class="field-section">
                                <div class="field-section-header">
                                  <v-icon small color="indigo" class="mr-1">mdi-code-braces</v-icon>
                                  Объекты
                                </div>
                                <div class="field-list">
                                  <v-checkbox
                                    v-for="field in getFilteredFields(getFieldsByType('object'))"
                                    v-bind:key="field.key || field.value"
                                    v-model="selectedFields[field.key || field.value]"
                                    v-bind:label="field.label || field.text"
                                    hide-details
                                    class="field-checkbox"
                                    color="indigo" />
                                </div>
                              </div>
                            </v-col>
                          </v-row>
                          
                          <!-- Остальные поля -->
                          <div v-if="getFilteredFields(getOtherFields()).length > 0" class="field-section">
                            <div class="field-section-header">
                              <v-icon small color="grey darken-1" class="mr-1">mdi-help-circle</v-icon>
                              Другие поля
                            </div>
                            <div class="field-list">
                              <v-checkbox
                                v-for="field in getFilteredFields(getOtherFields())"
                                v-bind:key="field.key || field.value"
                                v-model="selectedFields[field.key || field.value]"
                                v-bind:label="field.label || field.text"
                                hide-details
                                class="field-checkbox"
                                color="grey darken-1" />
                            </div>
                          </div>
                        </v-card>
                      </template>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    text
                    color="grey darken-1"
                    v-on:click="step = 1">
                    <v-icon left>mdi-arrow-left</v-icon>
                    Назад
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    v-bind:disabled="!hasSelectedFields"
                    rounded
                    elevation="2"
                    v-on:click="step = 3">
                    <v-icon left>mdi-arrow-right</v-icon>
                    Далее
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Шаг 3: Фильтрация данных -->
            <v-stepper-content step="3">
              <v-card flat>
                <v-card-text>
                  <h3 class="mb-4 primary--text">Фильтрация результатов</h3>
                  
                  <v-card class="pa-4 mb-4" outlined>
                    <v-switch
                      v-model="useFilters"
                      color="primary"
                      hide-details
                      inset
                      class="mb-3"
                      label="Использовать фильтрацию" />
                      
                    <v-slide-y-transition>
                      <div v-if="useFilters" class="mt-3">
                        <v-row>
                          <v-col cols="12" sm="4">
                            <v-select
                              v-model="filterField"
                              v-bind:items="availableFields"
                              item-text="label"
                              item-value="key"
                              label="Поле для фильтрации"
                              outlined
                              dense
                              return-object
                              hint="Выберите поле для фильтрации"
                              persistent-hint
                              v-bind:disabled="isFilterConfiguring"
                              v-on:change="onFilterFieldChange" />
                          </v-col>
                          
                          <v-col cols="12" sm="4">
                            <v-select
                              v-model="filterOperator"
                              v-bind:items="availableOperators"
                              item-text="label"
                              item-value="value"
                              label="Оператор"
                              outlined
                              dense
                              v-bind:disabled="!filterField || isFilterConfiguring"
                              hint="Выберите оператор сравнения"
                              persistent-hint />
                          </v-col>
                          
                          <v-col cols="12" sm="4">
                            <v-text-field
                              v-if="!isFilterBoolean"
                              v-model="filterValue"
                              label="Значение"
                              outlined
                              dense
                              v-bind:disabled="!filterField || !filterOperator || isFilterConfiguring"
                              hint="Введите значение для сравнения"
                              persistent-hint />
                              
                            <v-switch
                              v-else
                              v-model="filterValueBoolean"
                              color="primary"
                              hide-details
                              class="mt-4"
                              inset
                              v-bind:label="filterValueBoolean ? 'Истина' : 'Ложь'" />
                          </v-col>
                        </v-row>
                        
                        <div v-if="filterField && filterOperator" class="filter-preview mt-3 pa-3">
                          <div class="caption grey--text mb-1">Предпросмотр фильтра:</div>
                          <div class="body-2 font-weight-medium">{{ previewFilter }}</div>
                        </div>
                      </div>
                    </v-slide-y-transition>
                  </v-card>
                  
                  <h3 class="mb-4 primary--text">Сортировка результатов</h3>
                  
                  <v-card class="pa-4" outlined>
                    <v-switch
                      v-model="useSorting"
                      color="primary"
                      hide-details
                      inset
                      class="mb-3"
                      label="Использовать сортировку" />
                      
                    <v-slide-y-transition>
                      <div v-if="useSorting" class="mt-3">
                        <v-row>
                          <v-col cols="12" sm="8">
                            <v-select
                              v-model="sortField"
                              v-bind:items="availableFields"
                              item-text="label"
                              item-value="key"
                              label="Поле для сортировки"
                              outlined
                              dense
                              return-object
                              v-bind:disabled="isSortConfiguring" />
                          </v-col>
                          
                          <v-col cols="12" sm="4">
                            <v-btn-toggle
                              v-model="sortDirection"
                              color="primary"
                              group
                              mandatory
                              class="mt-1"
                              v-bind:disabled="!sortField || isSortConfiguring">
                              <v-btn value="asc" small>
                                <v-icon small left>mdi-sort-alphabetical-ascending</v-icon>
                                По возрастанию
                              </v-btn>
                              <v-btn value="desc" small>
                                <v-icon small left>mdi-sort-alphabetical-descending</v-icon>
                                По убыванию
                              </v-btn>
                            </v-btn-toggle>
                          </v-col>
                        </v-row>
                        
                        <div v-if="sortField" class="filter-preview mt-3 pa-3">
                          <div class="caption grey--text mb-1">Предпросмотр сортировки:</div>
                          <div class="body-2 font-weight-medium">{{ previewSort }}</div>
                        </div>
                      </div>
                    </v-slide-y-transition>
                  </v-card>
                </v-card-text>
                
                <v-card-actions>
                  <v-btn
                    text
                    color="grey darken-1"
                    v-on:click="step = 2">
                    <v-icon left>mdi-arrow-left</v-icon>
                    Назад
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    rounded
                    large
                    elevation="3"
                    class="px-6"
                    v-on:click="generateQuery">
                    <v-icon left>mdi-code-json</v-icon>
                    Сгенерировать запрос
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Шаг 4: Параметры сортировки -->
            <v-stepper-content step="4">
              <v-card flat>
                <v-card-text>
                  <h3>Настройте сортировку (опционально)</h3>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-switch
                        v-model="useSorting"
                        label="Использовать сортировку"
                        hide-details />
                    </v-col>
                  </v-row>

                  <v-row v-if="useSorting">
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="sortField"
                        v-bind:items="availableSortFields"
                        label="Поле для сортировки" />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="sortDirection"
                        v-bind:items="sortDirections"
                        label="Порядок сортировки" />
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    text
                    v-on:click="step = 3">
                    Назад
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    rounded
                    large
                    elevation="3"
                    class="px-6"
                    v-on:click="generateQuery">
                    <v-icon left>mdi-code-json</v-icon>
                    Сгенерировать запрос
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-card-text>
    </v-card>

    <!-- Встроенное окно предпросмотра запроса вместо диалога -->
    <div v-if="showQueryDialog" class="query-preview-overlay" v-on:click.self="showQueryDialog = false">
      <div class="query-preview-container">
        <v-card>
          <v-card-title class="grey lighten-4 d-flex align-center">
            <span>Сгенерированный запрос</span>
            <v-spacer />
            <v-btn 
              icon 
              title="Копировать запрос"
              v-on:click="copyQuery"
              class="mr-2">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
            <v-btn 
              icon 
              title="Закрыть"
              v-on:click="showQueryDialog = false"
              color="grey darken-1">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <pre class="generated-query">{{ generatedQuery }}</pre>
          </v-card-text>
        </v-card>
      </div>
    </div>
    
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
  // Импорт manager.js для принудительной загрузки манифеста
  import manifestParser from '@front/manifest/manager';

  export default {
    name: 'JSONataQueryBuilder',
    data() {
      return {
        step: 1,
        showQueryDialog: false,
        generatedQuery: '',
        selectedEntityType: null,
        useFilters: false,
        useSorting: false,
        filterField: null,
        filterOperator: null,
        filterValue: '',
        filterValueBoolean: false,
        isFilterConfiguring: false,
        isSortConfiguring: false,
        sortField: null,
        sortDirection: 'asc',
        isLoading: true,
        isLoadingFields: false,
        snackbar: false,
        snackbarText: '',
        snackbarColor: 'success',
        fieldSearch: '', // Новое поле для поиска по полям
      
        // Динамический список типов сущностей
        entityTypes: [],
      
        // Метамодель и её схема
        metamodelSchema: null,
      
        // Поля и их типы
        availableFields: [],
        fieldTypes: {},
      
        // Выбранные поля
        selectedFields: {
          id: true
        },

        // Операторы для фильтрации
        textOperators: [
          { text: 'содержит', value: 'contains' },
          { text: 'равно', value: 'equals' },
          { text: 'начинается с', value: 'startsWith' },
          { text: 'заканчивается на', value: 'endsWith' },
          { text: 'соответствует регулярному выражению', value: 'regex' }
        ],
      
        arrayOperators: [
          { text: 'содержит элемент', value: 'contains' },
          { text: 'содержит точное значение', value: 'equals' }
        ],

        // Направления сортировки
        sortDirections: [
          { text: 'По возрастанию', value: 'asc' },
          { text: 'По убыванию', value: 'desc' }
        ],

        filteringEnabled: false
      };
    },
    computed: {
      hasSelectedFields() {
        return Object.values(this.selectedFields).some(val => val);
      },
      availableFilterFields() {
        // Преобразуем доступные поля в формат для v-select
        return this.availableFields.map(field => ({
          text: field.label || field.text,
          value: field.key || field.value
        }));
      },
      availableSortFields() {
        // Выбираем только поля, которые можно сортировать
        const sortableFields = this.availableFields.filter(field => {
          const fieldKey = field.key || field.value;
          const fieldType = this.fieldTypes[fieldKey];
          return fieldType !== 'array' && fieldType !== 'object';
        });
        
        return [
          { text: 'ID', value: 'id' },
          ...sortableFields.map(field => ({
            text: field.label || field.text,
            value: field.key || field.value
          }))
        ];
      },
      readableOperator() {
        const op = this.filterOperator;
        switch (op) {
          case 'contains': return 'содержит';
          case 'equals': return 'равно';
          case 'startsWith': return 'начинается с';
          case 'endsWith': return 'заканчивается на';
          case 'regex': return 'соответствует рег. выр.';
          default: return op;
        }
      },
      // Доступные операторы для фильтрации
      availableOperators() {
        if (!this.filterField) return [];
        
        const fieldType = this.filterField.type || 'string';
        
        const operators = [
          // Общие операторы для всех типов
          { value: '=', label: 'Равно' },
          { value: '!=', label: 'Не равно' }
        ];
        
        // Операторы для строк
        if (fieldType === 'string') {
          operators.push(
            { value: 'contains', label: 'Содержит' },
            { value: 'not contains', label: 'Не содержит' },
            { value: 'starts with', label: 'Начинается с' },
            { value: 'ends with', label: 'Заканчивается на' }
          );
        }
        
        // Операторы для чисел
        if (fieldType === 'number') {
          operators.push(
            { value: '>', label: 'Больше' },
            { value: '>=', label: 'Больше или равно' },
            { value: '<', label: 'Меньше' },
            { value: '<=', label: 'Меньше или равно' }
          );
        }
        
        // Для логических значений оставляем только равно/не равно
        if (fieldType === 'boolean') {
          return [
            { value: '=', label: 'Равно' },
            { value: '!=', label: 'Не равно' }
          ];
        }
        
        // Для массивов
        if (fieldType === 'array') {
          return [
            { value: 'exists', label: 'Существует' },
            { value: 'not exists', label: 'Не существует' },
            { value: 'contains', label: 'Содержит элемент' },
            { value: 'not contains', label: 'Не содержит элемент' },
            { value: 'length >', label: 'Длина больше' },
            { value: 'length =', label: 'Длина равна' },
            { value: 'length <', label: 'Длина меньше' }
          ];
        }
        
        return operators;
      },
      
      // Проверка, является ли поле логическим
      isFilterBoolean() {
        return this.filterField && this.filterField.type === 'boolean';
      },
      
      // Предпросмотр фильтра
      previewFilter() {
        if (!this.filterField || !this.filterOperator) return '';
        
        const fieldKey = this.filterField.key || this.filterField.value;
        const fieldType = this.filterField.type || 'string';
        const operator = this.filterOperator;
        
        // Значение для сравнения (строка или логическое)
        const value = fieldType === 'boolean' ? this.filterValueBoolean : this.filterValue;
        
        // Формируем читаемый пример фильтра
        const fieldName = this.filterField.label || this.filterField.text || fieldKey;
        
        if (operator === 'exists') {
          return `${fieldName} существует`;
        } else if (operator === 'not exists') {
          return `${fieldName} не существует`;
        } else if (operator.startsWith('length')) {
          const lengthOp = operator.split(' ')[1];
          return `Длина ${fieldName} ${this.getHumanOperator(lengthOp)} ${value}`;
        } else {
          return `${fieldName} ${this.getHumanOperator(operator)} ${value}`;
        }
      },
      
      // Предпросмотр сортировки
      previewSort() {
        if (!this.sortField) return '';
        
        const fieldName = this.sortField.label || this.sortField.text || this.sortField.key || this.sortField.value;
        const direction = this.sortDirection === 'asc' ? 'по возрастанию' : 'по убыванию';
        
        return `${fieldName} ${direction}`;
      }
    },
    watch: {
      selectedEntityType(newVal) {
        if (newVal) {
          this.loadEntityFields(newVal);
        }
      },
      filterField() {
        // Сбрасываем операторы при изменении поля
        this.filterOperator = null;
        this.filterValue = '';
        this.filterValueBoolean = false;
      }
    },
    created() {
      // Проверяем доступность хранилища Vuex
      console.log('Компонент создан, проверяем доступность Vuex');
      if (this.$store) {
        console.log('Хранилище Vuex доступно через this.$store');
      } else if (window.Vuex) {
        console.log('Хранилище Vuex доступно через window.Vuex');
      } else {
        console.warn('Хранилище Vuex недоступно!');
      }
      
      // Подписка на события изменения манифеста
      if (window.addEventListener) {
        window.addEventListener('manifestUpdated', this.handleManifestUpdated);
      }
    },
    beforeDestroy() {
      // Отписка от событий при уничтожении компонента
      if (window.removeEventListener) {
        window.removeEventListener('manifestUpdated', this.handleManifestUpdated);
      }
    },
    mounted() {
      console.log('Компонент смонтирован, начинаем загрузку данных');
      // Сбрасываем состояние при каждом монтировании компонента
      this.resetState();
      // Используем механизм с повторными попытками и ожиданием манифеста
      this.waitForManifestAndLoad();
    },
    methods: {
      // Сброс состояния компонента
      resetState() {
        this.step = 1;
        this.selectedEntityType = null;
        this.useFilters = false;
        this.useSorting = false;
        this.filterField = null;
        this.filterOperator = null;
        this.filterValue = '';
        this.filterValueBoolean = false;
        this.availableFields = [];
        this.fieldTypes = {};
        this.selectedFields = { id: true };
        this.sortField = null;
        this.sortDirection = 'asc';
        this.generatedQuery = '';
        this.fieldSearch = '';
      },
      // Обработчик события обновления манифеста
      handleManifestUpdated() {
        console.log('Получено событие обновления манифеста');
        // Перезагружаем типы сущностей
        this.waitForManifestAndLoad();
      },
      
      // Принудительная загрузка манифеста
      async forceLoadManifest() {
        try {
          console.log('Пытаемся принудительно загрузить манифест...');
          
          if (manifestParser && typeof manifestParser.reloadManifest === 'function') {
            await manifestParser.reloadManifest();
            console.log('Принудительная загрузка манифеста выполнена');
            return true;
          } else {
            console.error('Функция reloadManifest недоступна');
            return false;
          }
        } catch (error) {
          console.error('Ошибка при принудительной загрузке манифеста:', error);
          return false;
        }
      },
      
      // Новый метод для ожидания загрузки манифеста
      async waitForManifestAndLoad() {
        let attempts = 0;
        const maxAttempts = 10; // Увеличиваем до 10 попыток
        const delay = 700; // 700 мс между попытками (увеличиваем интервал)
        
        // Сбрасываем состояние загрузки
        this.isLoading = true;
        
        // Сначала пробуем принудительно загрузить манифест
        let forceLoadAttempted = false;
        
        // Функция проверки манифеста с повторными попытками
        const tryLoadManifest = async() => {
          attempts++;
          console.log(`Попытка загрузки манифеста #${attempts}`);
          
          // Проверяем наличие манифеста
          const manifest = window.Vuex?.state?.manifest;
          
          if (manifest && typeof manifest === 'object' && Object.keys(manifest).length > 0) {
            // Дополнительная проверка, что в манифесте есть хотя бы один объект
            let hasValidSection = false;
            for (const key in manifest) {
              if (typeof manifest[key] === 'object' && manifest[key] !== null && Object.keys(manifest[key]).length > 0) {
                hasValidSection = true;
                break;
              }
            }
            
            if (hasValidSection) {
              console.log('Манифест найден и содержит данные, загружаем типы сущностей');
              this.loadEntityTypes();
              return;
            }
          }
          
          // Если достигли половины попыток, пробуем принудительно загрузить манифест
          if (attempts === Math.floor(maxAttempts / 2) && !forceLoadAttempted) {
            console.log('Половина попыток исчерпана, пробуем принудительно загрузить манифест');
            forceLoadAttempted = true;
            await this.forceLoadManifest();
            // Продолжаем попытки
          }
          
          // Если исчерпаны попытки - используем стандартные типы
          if (attempts >= maxAttempts) {
            console.error(`Манифест не загружен должным образом после ${maxAttempts} попыток`);
            this.showError('Не удалось загрузить манифест после нескольких попыток');
            this.loadDefaultEntityTypes();
            return;
          }
          
          // Планируем следующую попытку
          console.log(`Манифест не загружен полностью, повторная попытка через ${delay}мс...`);
          setTimeout(tryLoadManifest, delay);
        };
        
        // Запускаем первую попытку
        tryLoadManifest();
      },
    
      // Загрузка типов сущностей
      async loadEntityTypes() {
        this.isLoading = true;
        this.entityTypes = [];
        
        try {
          console.log('Загрузка типов сущностей...');
          
          // Получаем манифест напрямую из Vuex
          const manifest = window.Vuex?.state?.manifest || {};
          
          if (!manifest || typeof manifest !== 'object' || Object.keys(manifest).length === 0) {
            console.error('Манифест отсутствует или пустой.');
            throw new Error('Манифест недоступен');
          }
          
          console.log('Манифест получен, анализ типов сущностей...');
          
          // Иконки для типов сущностей
          const icons = {
            components: 'mdi-cube-outline',
            aspects: 'mdi-layers-outline',
            contexts: 'mdi-view-grid-outline',
            technologies: 'mdi-code-tags',
            docs: 'mdi-file-document-outline',
            entities: 'mdi-shape-outline',
            rules: 'mdi-ruler',
            namespaces: 'mdi-folder-multiple-outline',
            forms: 'mdi-form-select',
            datasets: 'mdi-database',
            $package: 'mdi-package-variant-closed'
          };
          
          // Названия для типов сущностей
          const labels = {
            components: 'Компоненты',
            aspects: 'Аспекты',
            contexts: 'Контексты',
            technologies: 'Технологии',
            docs: 'Документы',
            entities: 'Сущности',
            rules: 'Правила',
            namespaces: 'Пространства имён',
            forms: 'Формы',
            datasets: 'Наборы данных',
            $package: 'Пакеты'
          };
          
          // Собираем все разделы верхнего уровня
          const validTypes = [];
          
          for (const key in manifest) {
            // Пропускаем служебные поля, но оставляем $package
            if (key.startsWith('$') && key !== '$package') continue;
            
            // Проверяем что это объект
            if (typeof manifest[key] === 'object' && manifest[key] !== null && !Array.isArray(manifest[key])) {
              const count = Object.keys(manifest[key]).length;
              
              if (count > 0) {
                console.log(`Тип ${key}: количество элементов = ${count}`);
                validTypes.push({
                  type: key,
                  count: count
                });
              }
            }
          }
          
          console.log('Найдено типов сущностей с элементами:', validTypes.length);
          
          // Строим список типов сущностей для UI
          for (const item of validTypes) {
            this.entityTypes.push({
              type: item.type,
              label: labels[item.type] || this.formatEntityName(item.type),
              icon: icons[item.type] || 'mdi-database',
              description: `${item.count} ${this.getDeclension(item.count, ['элемент', 'элемента', 'элементов'])}`
            });
          }
          
          // Если не нашли ни одного типа, загружаем стандартные
          if (this.entityTypes.length === 0) {
            console.warn('Не найдено ни одного типа сущности');
            this.loadDefaultEntityTypes();
          }
        } catch (error) {
          console.error('Ошибка при загрузке типов сущностей:', error);
          this.showError(`Ошибка: ${error.message}`);
          this.loadDefaultEntityTypes();
        } finally {
          this.isLoading = false;
        }
      },
    
      // Загрузка полей для выбранного типа сущности
      async loadEntityFields(entityType) {
        this.isLoadingFields = true;
        this.availableFields = [];
        this.fieldTypes = {};
        
        console.log(`Загрузка полей для типа: ${entityType}`);
        
        try {
          // Получаем схему из Vuex если доступно
          if (this.$store.state.manifest && this.$store.state.manifest.model) {
            const metamodel = this.$store.state.manifest.model;
            
            // Определяем важные поля для разных типов сущностей
            const importantFields = {
              components: ['id', 'name', 'type', 'entity', 'aspects'],
              entities: ['id', 'name', 'title', 'config', 'objects'],
              users: ['id', 'name', 'email'],
              aspects: ['id', 'name', 'type']
            };
            
            // Добавляем важные поля для данного типа
            if (importantFields[entityType]) {
              importantFields[entityType].forEach(field => {
                this.availableFields.push(field);
                // Определение типа поля
                this.fieldTypes[field] = field === 'id' ? 'string' : 'string';
              });
            }
            
            // Находим схему для выбранного типа сущности
            if (metamodel && metamodel[entityType]) {
              // Обрабатываем основную схему
              this.addField(metamodel[entityType], '');
              
              // Для компонентов, проверяем также схему аспектов
              if (entityType === 'components' && metamodel.aspects) {
                Object.keys(metamodel.aspects).forEach(aspectKey => {
                  const aspectPrefix = `aspects.${aspectKey}`;
                  this.addField(metamodel.aspects[aspectKey], aspectPrefix);
                });
              }
              
              // Для entities, проверяем также объекты и конфиг
              if (entityType === 'entities' && metamodel.config) {
                this.addField(metamodel.config, 'config');
              }
              
              if (entityType === 'entities' && metamodel.objects) {
                this.addField(metamodel.objects, 'objects');
              }
            }
            
            console.log(`Загружено ${this.availableFields.length} полей для ${entityType}`);
          } else {
            console.warn('Метамодель не найдена в Vuex');
          }
        } catch (error) {
          console.error('Ошибка при загрузке полей:', error);
        } finally {
          this.isLoadingFields = false;
        }
      },
    
      // Загрузка стандартных полей при ошибке
      loadDefaultFields() {
        const defaultFields = [
          { key: 'id', label: 'ID', type: 'string' },
          { key: 'title', label: 'Название', type: 'string' },
          { key: 'name', label: 'Имя', type: 'string' },
          { key: 'description', label: 'Описание', type: 'string' },
          { key: 'entity', label: 'Сущность', type: 'string' },
          { key: 'links', label: 'Ссылки', type: 'array' },
          { key: 'aspects', label: 'Аспекты', type: 'array' }
        ];
      
        this.availableFields = defaultFields;
      
        defaultFields.forEach(field => {
          this.fieldTypes[field.key] = field.type;
          this.selectedFields[field.key] = ['id', 'title', 'name', 'entity'].includes(field.key);
        });
        
        console.log('Загружены стандартные поля:', this.availableFields);
      },
    
      // Форматирование названия сущности
      formatEntityName(name) {
        if (!name) return '';
      
        // Форматирование camelCase и специальных типов
        const formattedNames = {
          'components': 'Компоненты',
          'aspects': 'Аспекты',
          'contexts': 'Контексты',
          'technologies': 'Технологии',
          'docs': 'Документы',
          'entities': 'Сущности',
          'rules': 'Правила'
        };
      
        // Если есть в словаре - возвращаем готовое название
        if (formattedNames[name]) {
          return formattedNames[name];
        }
      
        // Иначе делаем первую букву заглавной
        return name.charAt(0).toUpperCase() + name.slice(1);
      },
    
      /**
       * Форматирует имя поля для отображения, заменяя точки на стрелки
       * и преобразуя camelCase в читабельный формат
       * @param {String} fieldName - Имя поля
       * @returns {String} Отформатированное имя
       */
      formatFieldName(fieldName) {
        if (!fieldName) return '';
        
        // Заменяем точки на стрелки и разбиваем поле на части
        const parts = fieldName.split('.');
        return parts.map(part => {
          // Преобразуем camelCase в "Человекочитаемый текст"
          return part
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        }).join(' → ');
      },
    
      // Получение читаемого имени поля
      getReadableFieldName(fieldKey) {
        const field = this.availableFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
      },
    
      // Выбор типа сущности
      selectEntityType(type) {
        try {
          console.log(`Выбран тип сущности: ${type}`);
          this.selectedEntityType = type;
          
          // Сбрасываем текущие данные полей
          this.availableFields = [];
          this.fieldTypes = {};
          this.selectedFields = { id: true };
          
          // Начинаем загрузку полей с задержкой для визуального отзыва UI
          setTimeout(() => {
            this.loadEntityFieldsWithRetry(type);
          }, 100);
        } catch (error) {
          console.error('Ошибка при выборе типа сущности:', error);
          this.showError(`Не удалось выбрать тип: ${error.message}`);
        }
      },
      
      // Загрузка полей с повторными попытками
      async loadEntityFieldsWithRetry(entityType, attempt = 1) {
        const maxAttempts = 3;
        
        try {
          this.isLoadingFields = true;
          
          console.log(`Загрузка полей для типа ${entityType}, попытка ${attempt}/${maxAttempts}`);
          
          // Получаем манифест напрямую из Vuex
          const manifest = window.Vuex?.state?.manifest || {};
          
          if (!manifest || !manifest[entityType]) {
            throw new Error(`Тип сущности ${entityType} не найден в манифесте`);
          }
          
          const entityItems = manifest[entityType];
          const keys = Object.keys(entityItems);
          
          if (keys.length === 0) {
            throw new Error(`Не найдены элементы типа ${entityType}`);
          }
          
          // Очищаем предыдущие поля
          this.availableFields = [];
          this.fieldTypes = {};
          this.selectedFields = { id: true }; // ID всегда выбран по умолчанию
          
          // Получаем все доступные сущности данного типа для более полного анализа
          const sampleEntities = [];
          
          // Берем до 5 элементов для анализа (чтобы собрать больше полей)
          for (let i = 0; i < Math.min(5, keys.length); i++) {
            const key = keys[i];
            const entity = entityItems[key];
            if (entity && typeof entity === 'object') {
              sampleEntities.push(entity);
            }
          }
          
          if (sampleEntities.length === 0) {
            throw new Error('Не удалось получить образцы для анализа полей');
          }
          
          console.log(`Анализ полей для типа ${entityType} на основе ${sampleEntities.length} образцов`);
          
          // Динамический список полей - собираем из всех образцов
          const allFields = new Set(['id']); // ID всегда должен быть
          
          // Собираем все имеющиеся поля из всех образцов
          sampleEntities.forEach(entity => {
            Object.keys(entity).forEach(key => {
              if (!key.startsWith('$')) { // Игнорируем служебные поля
                allFields.add(key);
              }
            });
          });
          
          console.log(`Обнаружено ${allFields.size} разных полей в образцах ${entityType}`);
          
          // Важные поля для каждого типа сущности (для автоматического выбора)
          const importantFields = {
            components: ['title', 'description', 'entity', 'aspects', 'links'],
            aspects: ['title', 'description', 'links'],
            contexts: ['title', 'description', 'links'],
            technologies: ['title', 'section', 'links'],
            docs: ['title', 'description', 'type', 'content', 'links'],
            entities: ['title', 'schema', 'config', 'objects', 'links'],
            rules: ['title', 'validators', 'links']
          };
          
          // Базовые поля всегда должны присутствовать
          this.availableFields.push({ key: 'id', label: 'ID', type: 'string' });
          this.fieldTypes['id'] = 'string';
          this.selectedFields['id'] = true;
          
          // Добавляем все найденные поля
          allFields.forEach(key => {
            if (key === 'id') return; // ID уже добавлен
            
            // Определяем тип поля
            let fieldType = 'string';
            let fieldValue = null;
            
            // Ищем образец с этим полем
            for (const entity of sampleEntities) {
              if (key in entity) {
                fieldValue = entity[key];
                if (Array.isArray(fieldValue)) {
                  fieldType = 'array';
                } else if (fieldValue !== null && typeof fieldValue === 'object') {
                  fieldType = 'object';
                } else {
                  fieldType = typeof fieldValue;
                }
                break;
              }
            }
            
            // Добавляем поле
            this.fieldTypes[key] = fieldType;
            this.availableFields.push({
              key: key,
              label: this.formatFieldName(key),
              type: fieldType
            });
            
            // Отмечаем важные поля
            this.selectedFields[key] = importantFields[entityType]?.includes(key) || false;
            
            // Добавляем вложенные поля для объектов
            if (fieldType === 'object' && fieldValue) {
              Object.keys(fieldValue).forEach(subKey => {
                if (subKey.startsWith('$')) return;
                
                const nestedKey = `${key}.${subKey}`;
                const nestedValue = fieldValue[subKey];
                let nestedType = typeof nestedValue;
                
                if (Array.isArray(nestedValue)) {
                  nestedType = 'array';
                } else if (nestedValue !== null && typeof nestedValue === 'object') {
                  nestedType = 'object';
                }
                
                this.fieldTypes[nestedKey] = nestedType;
                this.availableFields.push({
                  key: nestedKey,
                  label: this.formatFieldName(nestedKey),
                  type: nestedType
                });
                this.selectedFields[nestedKey] = false;
              });
            }
          });
          
          // Проверяем наличие важных полей, которые могли отсутствовать в образцах
          const allFieldsSet = new Set(this.availableFields.map(f => f.key));
          
          // Добавляем отсутствующие важные поля
          if (importantFields[entityType]) {
            importantFields[entityType].forEach(field => {
              if (!allFieldsSet.has(field)) {
                const fieldType = field.endsWith('s') ? 'array' : 'string';
                this.fieldTypes[field] = fieldType;
                this.availableFields.push({
                  key: field,
                  label: this.formatFieldName(field),
                  type: fieldType
                });
                this.selectedFields[field] = true;
              }
            });
          }
          
          // Сортируем поля: сначала важные, потом по алфавиту
          const priorityFields = importantFields[entityType] || ['title', 'name'];
          this.availableFields.sort((a, b) => {
            // ID всегда первый
            if (a.key === 'id') return -1;
            if (b.key === 'id') return 1;
            
            // Если одно поле приоритетное, а другое нет
            const aIsPriority = priorityFields.includes(a.key);
            const bIsPriority = priorityFields.includes(b.key);
            
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            
            // Если оба приоритетные или оба не приоритетные - сортируем по алфавиту
            return a.label.localeCompare(b.label);
          });
          
          console.log(`Найдено ${this.availableFields.length} уникальных полей для типа ${entityType}`);
          console.log('Доступные поля:', this.availableFields);
          
          // Если не нашли ни одного поля, загружаем стандартные
          if (this.availableFields.length === 0) {
            console.warn(`Не найдено полей для типа ${entityType}`);
            this.loadDefaultFields();
          } else {
            // После успешной загрузки полей предлагаем перейти к следующему шагу
            // Небольшая задержка для улучшения UX
            setTimeout(() => {
              this.step = 2;
            }, 300);
          }
        } catch (error) {
          console.error(`Ошибка при загрузке полей для типа ${entityType}:`, error);
          
          // Пробуем ещё раз, если не достигли максимального числа попыток
          if (attempt < maxAttempts) {
            console.log(`Повторная попытка загрузки полей для ${entityType}...`);
            setTimeout(() => {
              this.loadEntityFieldsWithRetry(entityType, attempt + 1);
            }, 500);
          } else {
            // Если все попытки исчерпаны, используем стандартные поля
            this.showError(`Не удалось загрузить поля: ${error.message}`);
            this.loadDefaultFields();
            // Переходим к следующему шагу даже с дефолтными полями
            setTimeout(() => {
              this.step = 2;
            }, 300);
          }
        } finally {
          this.isLoadingFields = false;
        }
      },
    
      // Очистка фильтра
      clearFilter() {
        this.filterField = null;
        this.filterOperator = null;
        this.filterValue = '';
        this.filterValueBoolean = false;
      },
    
      // Получение операторов для выбранного поля
      getOperatorsForField() {
        if (!this.filterField) return [];
      
        const fieldType = this.fieldTypes[this.filterField];
      
        if (fieldType === 'array') {
          return this.arrayOperators;
        }
      
        return this.textOperators;
      },
    
      // Склонение числительных
      getDeclension(number, titles) {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[
          number % 100 > 4 && number % 100 < 20 
            ? 2 
            : cases[number % 10 < 5 ? number % 10 : 5]
        ];
      },
    
      // Генерация JSONata запроса
      generateQuery() {
        let query = '(\n';
        query += '  $MANIFEST := $;\n';
    
        // Основной запрос к сущности
        query += `  $MANIFEST.${this.selectedEntityType}.$spread()`;
    
        // Применение фильтра, если он указан
        if (this.useFilters && this.filterField && this.filterOperator && this.filterValue) {
          query += this.buildFilterExpression();
        }
    
        // Формирование выбора полей
        query += this.buildFieldSelection();
    
        // Сортировка, если нужна
        if (this.useSorting && this.sortField) {
          query += `^(${this.sortField}${this.sortDirection === 'desc' ? ' ~> $reverse()' : ''})`;
        }
    
        query += '\n)';
    
        this.generatedQuery = query;
        this.showQueryDialog = true;
      },
    
      // Построение выражения фильтрации
      buildFilterExpression() {
        let filter = '';
        const fieldKey = this.filterField.key || this.filterField.value;
        const fieldType = this.fieldTypes[fieldKey] || 'string';
      
        try {
          // Безопасное экранирование значения фильтра для использования в запросе
          let safeFilterValue = this.filterValue.replace(/"/g, '\\"');
          
          // Проверка, является ли поле вложенным
          const isNestedField = fieldKey.includes('.');
          
          // Для вложенных полей строим путь доступа
          let accessPath = '';
          if (isNestedField) {
            const parts = fieldKey.split('.');
            accessPath = '*.';
            for (let i = 0; i < parts.length; i++) {
              accessPath += parts[i];
              if (i < parts.length - 1) {
                accessPath += '.';
              }
            }
          } else {
            accessPath = fieldKey === 'id' ? '$keys()[0]' : `*.${fieldKey}`;
          }
        
          // Различная обработка в зависимости от типа поля
          if (fieldType === 'array') {
            // Фильтры для массивов
            switch (this.filterOperator) {
              case 'contains':
                filter = `["${safeFilterValue}" in ${accessPath}]`;
                break;
              case 'equals':
                filter = `[${accessPath} = "${safeFilterValue}"]`;
                break;
              default:
                filter = `["${safeFilterValue}" in ${accessPath}]`;
            }
          } else if (fieldType === 'object') {
            // Для объектов ищем в строковом представлении
            filter = `[$contains($string(${accessPath}), "${safeFilterValue}")]`;
          } else {
            // Фильтры для скалярных типов
            switch (this.filterOperator) {
              case 'contains':
                filter = `[$contains(${accessPath}, "${safeFilterValue}")]`;
                break;
              case 'equals':
                filter = `[${accessPath} = "${safeFilterValue}"]`;
                break;
              case 'startsWith':
                filter = `[$startsWith(${accessPath}, "${safeFilterValue}")]`;
                break;
              case 'endsWith':
                filter = `[$endsWith(${accessPath}, "${safeFilterValue}")]`;
                break;
              case 'regex':
                try {
                  // Проверяем валидность регулярного выражения
                  new RegExp(safeFilterValue);
                  filter = `[$match(${accessPath}, /${safeFilterValue}/)]`;
                } catch (e) {
                  // При некорректном регулярном выражении используем contains
                  filter = `[$contains(${accessPath}, "${safeFilterValue}")]`;
                  this.showError('Некорректное регулярное выражение, используем обычный поиск');
                }
                break;
              default:
                // По умолчанию используем contains
                filter = `[$contains(${accessPath}, "${safeFilterValue}")]`;
            }
          }
        
          return filter;
        } catch (error) {
          console.error('Ошибка при построении фильтра:', error);
          // Возвращаем простой фильтр при ошибке
          return `[${fieldKey === 'id' ? '$keys()[0]' : `*.${fieldKey}`} ? true : false]`;
        }
      },
    
      // Построение выбора полей
      buildFieldSelection() {
        let fields = '';
        // Получаем ключи выбранных полей
        const selectedFieldKeys = Object.keys(this.selectedFields).filter(key => this.selectedFields[key]);
      
        if (selectedFieldKeys.length > 0) {
          fields += '.{\n';
        
          selectedFieldKeys.forEach((fieldKey, index) => {
            const fieldType = this.fieldTypes[fieldKey] || 'string';
          
            // Специальная обработка для различных типов полей
            if (fieldKey === 'id') {
              // ID всегда берем из ключа объекта
              fields += '    "id": $keys()[0]';
            } else if (fieldKey.includes('.')) {
              // Для вложенных полей строим путь доступа
              const parts = fieldKey.split('.');
              
              // Последняя часть - это имя поля для вывода
              const fieldName = parts[parts.length - 1];
              
              // Выстраиваем путь с нужной вложенностью
              let path = '*';
              for (const part of parts) {
                path += '.' + part;
              }
              
              fields += `    "${fieldName}": ${path}`;
            } else if (fieldType === 'object') {
              // Для объектов возвращаем полный объект
              fields += `    "${fieldKey}": *.${fieldKey}`;
            } else if (fieldType === 'array') {
              // Для массивов возвращаем массив как есть
              fields += `    "${fieldKey}": *.${fieldKey}`;
            } else {
              // Для скалярных типов (строки, числа и т.д.)
              fields += `    "${fieldKey}": *.${fieldKey}`;
            }
          
            if (index < selectedFieldKeys.length - 1) {
              fields += ',\n';
            } else {
              fields += '\n';
            }
          });
        
          fields += '  }';
        }
      
        return fields;
      },
    
      // Копирование запроса в буфер обмена
      copyQuery() {
        navigator.clipboard.writeText(this.generatedQuery)
          .then(() => {
            this.showSnackbar('Запрос скопирован в буфер обмена');
          })
          .catch(err => {
            console.error('Не удалось скопировать текст: ', err);
            this.showSnackbar('Не удалось скопировать текст в буфер обмена', 'error');
          });
      },
    
      // Отображение ошибки
      showError(message) {
        this.showSnackbar(message, 'error');
      },
    
      // Отображение уведомления
      showSnackbar(text, color = 'success') {
        this.snackbarText = text;
        this.snackbarColor = color;
        this.snackbar = true;
      },
    
      // Обработка типов сущностей из метамодели
      processEntityTypes() {
        if (!this.metamodelSchema) return;
      
        const icons = {
          components: 'mdi-cube-outline',
          aspects: 'mdi-layers-outline',
          contexts: 'mdi-view-grid-outline',
          technologies: 'mdi-code-tags',
          docs: 'mdi-file-document-outline',
          entities: 'mdi-shape-outline',
          rules: 'mdi-ruler'
        };
      
        this.entityTypes = this.metamodelSchema.entityTypes.map(type => {
          const count = this.metamodelSchema.entityCounts[type] || 0;
        
          return {
            type: type,
            label: this.formatEntityName(type),
            icon: icons[type] || 'mdi-database',
            description: `${count} ${this.getDeclension(count, ['элемент', 'элемента', 'элементов'])}`
          };
        });
      },
    
      // Загрузка стандартных типов сущностей при ошибке
      loadDefaultEntityTypes() {
        const defaultTypes = [
          { type: 'components', label: 'Компоненты', icon: 'mdi-cube-outline', description: 'Компоненты (по умолчанию)' },
          { type: 'aspects', label: 'Аспекты', icon: 'mdi-layers-outline', description: 'Аспекты (по умолчанию)' },
          { type: 'contexts', label: 'Контексты', icon: 'mdi-view-grid-outline', description: 'Контексты (по умолчанию)' },
          { type: 'technologies', label: 'Технологии', icon: 'mdi-code-tags', description: 'Технологии (по умолчанию)' },
          { type: 'docs', label: 'Документы', icon: 'mdi-file-document-outline', description: 'Документы (по умолчанию)' },
          { type: 'entities', label: 'Сущности', icon: 'mdi-shape-outline', description: 'Сущности (по умолчанию)' },
          { type: 'rules', label: 'Правила', icon: 'mdi-ruler', description: 'Правила (по умолчанию)' }
        ];
      
        this.entityTypes = defaultTypes;
        this.showError('Используются предустановленные типы сущностей');
      },
    
      // Выбор всех полей
      selectAllFields(select) {
        const allFields = this.availableFields.map(f => f.key);
        for (const key of allFields) {
          this.selectedFields[key] = select;
        }
        // Всегда сохраняем id выбранным если включаем все поля
        if (select) {
          this.selectedFields.id = true;
        }
      },
    
      // Получение приоритетных полей
      getPriorityFields() {
        const importantFields = {
          components: ['title', 'description', 'entity'],
          aspects: ['title', 'description'],
          contexts: ['title', 'description'],
          technologies: ['title', 'section'],
          docs: ['title', 'description', 'type'],
          entities: ['title', 'schema'],
          rules: ['title', 'validators']
        };
        
        const priorityFieldKeys = importantFields[this.selectedEntityType] || ['title', 'name'];
        return this.availableFields.filter(field => 
          priorityFieldKeys.includes(field.key) && 
          !['array', 'object'].includes(field.type)
        );
      },
    
      // Получение полей по типу данных
      getFieldsByType(type) {
        const priorityFields = this.getPriorityFields().map(f => f.key);
        return this.availableFields.filter(field => 
          field.type === type && 
          field.key !== 'id' && 
          !priorityFields.includes(field.key)
        );
      },
      
      // Получение прочих полей
      getOtherFields() {
        const priorityFields = this.getPriorityFields().map(f => f.key);
        const knownTypes = ['string', 'number', 'boolean', 'array', 'object'];
        return this.availableFields.filter(field => 
          field.key !== 'id' && 
          !priorityFields.includes(field.key) && 
          !knownTypes.includes(field.type)
        );
      },

      // Получение отфильтрованных полей на основе поиска
      getFilteredFields(fields) {
        if (!this.fieldSearch) return fields;
        
        const search = this.fieldSearch.toLowerCase();
        return fields.filter(field => {
          const label = (field.label || field.text || '').toLowerCase();
          const key = (field.key || field.value || '').toLowerCase();
          return label.includes(search) || key.includes(search);
        });
      },

      // Получение читаемого оператора для отображения
      getHumanOperator(operator) {
        const operatorMap = {
          '=': 'равно',
          '!=': 'не равно',
          '>': 'больше',
          '>=': 'больше или равно',
          '<': 'меньше',
          '<=': 'меньше или равно',
          'contains': 'содержит',
          'not contains': 'не содержит',
          'starts with': 'начинается с',
          'ends with': 'заканчивается на'
        };
        
        return operatorMap[operator] || operator;
      },
      
      // Обработка изменения поля фильтрации
      onFilterFieldChange() {
        this.filterOperator = null;
        this.filterValue = '';
        this.filterValueBoolean = false;
      },

      /**
       * Добавляет поле (включая вложенные) в список доступных полей
       * @param {Object} obj - Объект с полями
       * @param {String} prefix - Префикс для имени поля (для вложенных полей)
       * @param {String} fieldType - Тип поля по умолчанию
       */
      addField(obj, prefix = '', fieldType = 'string') {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          // Если это вложенный объект, рекурсивно обрабатываем его
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            this.addField(obj[key], fullKey, fieldType);
          } else {
            // Определяем тип поля по значению если возможно
            let detectedType = fieldType;
            if (Array.isArray(obj[key])) {
              detectedType = 'array';
            } else if (typeof obj[key] === 'boolean') {
              detectedType = 'boolean';
            } else if (typeof obj[key] === 'number') {
              detectedType = 'number';
            }
            
            // Добавляем поле, если его еще нет
            if (!this.availableFields.includes(fullKey)) {
              this.availableFields.push(fullKey);
              this.fieldTypes[fullKey] = detectedType;
              console.log(`Добавлено поле: ${fullKey} (тип: ${detectedType})`);
            }
          }
        });
      }
    }
  };
</script>

<style scoped>
.entity-card {
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 12px;
}

.entity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.entity-card.selected {
  border-color: #9e9e9e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.generated-query {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #333;
  line-height: 1.5;
  overflow: auto;
  max-height: 400px;
  border: 1px solid #eee;
}

.field-section {
  margin-top: 16px;
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

.field-section-header {
  font-weight: bold;
  margin-bottom: 10px;
  color: #424242;
  letter-spacing: 0.5px;
}

.field-checkbox {
  margin-top: 6px;
}

.id-field {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.field-selector {
  border-radius: 8px;
  background-color: #fafafa;
  max-height: 500px;
  overflow-y: auto;
}

.field-list {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 10px;
}

.field-actions {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.filter-preview {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  border-left: 3px solid var(--v-primary-base);
}

/* Стили для наложения предпросмотра запроса */
.query-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Увеличенный z-index, чтобы быть над всеми элементами */
}

.query-preview-container {
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25); /* Добавлена тень для лучшего выделения */
  border-radius: 4px;
  overflow: hidden; /* Предотвращает выход содержимого за пределы контейнера */
  isolation: isolate; /* Создает новый stacking context */
}

.generated-query {
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
