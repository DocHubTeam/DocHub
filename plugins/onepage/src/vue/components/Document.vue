<template>
  <div class="desk">
    <react 
      v-if="passedProps.data"
      ref="onepage"
      class="diagram"
      v-bind:component="reactComponent"
      v-bind:passed-props="passedProps" />
  </div>
</template>

<script>

  import { ReactWrapper } from 'vuera';
  import { Onepage } from '../../react/onepage.tsx';

  export default {
    name: 'OnePage',
    components: {
      react: ReactWrapper
    },
    props: {
      // Требуем обязательно передавать профайл документа 
      profile: {
        type: Object,
        required: true
      },
      // Требуем обязательно передавать функцию получения контента
      getContent: {
        type: Function,
        required: true
      },
      // Требуем обязательно передавать функцию доступа к Data Lake
      pullData: {
        type: Function,
        required: true
      },
      // Требуем обязательно сообщать путь к объекту описывающему документ в коде
      path: {
        type: String,
        required: true
      },
      // Запрашиваем параметры рендеринга
      params: {
        type: Object,
        default: null
      },
      // Признак рендеринга для печати
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        passedProps: {
          title: 'title',
          content: 'The content',
          data: null
        },
        reactComponent: Onepage
      };
    },

    watch: {
      profile() {
        // При изменении параметров, генерируем событие обновления
        this.onRefresh();
      }
    },
    mounted() {
      // При монтировании компонента в DOM, генерируем событие обновления
      this.onRefresh();
    },
    methods: {
      // Функция обновления контента документа с учетом параметров содержащихся в "this.profile"
      doRefresh() {
        // Получаем данные из source
        this.pullData().then((result) => this.passedProps.data = result);
      },

      // Обработчик события обновления
      onRefresh() {
        // Если обработчик уже запущен, останавливаем его
        if (this.refresher) clearTimeout(this.refresher);
        // Для исключения избыточных обращений к Data Lake откладываем обновление на 50мс
        this.refresher = setTimeout(this.doRefresh, 50);
      }
    }
  };
</script>

<style scoped>
.desk {
  height: 100%;
  width: 100%;
}

.desk .diagram {
  margin-top: 32px;
  height: calc(100% - 32px);
}

</style>
