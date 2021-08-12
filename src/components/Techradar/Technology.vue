<template>
  <v-container style="min-width: 100%">
    <h1>{{technology}}</h1>
    <h3>{{summary.title}}</h3>
    <div v-if="summary.aliases">Синонимы: {{summary.aliases.join('; ')}}</div>
    <div v-if="summary.link">Сайт: <a :href="summary.link" target="_blank">{{summary.link}}</a></div>
    <div class="summary-block">
      <div v-if="summary.components">Используется в компонентах:</div>
      <ul class="components">
        <li class="component" v-for="component in summary.components" :key="component.id">
          <router-link
              :to="`/architect/components/${component.id}`">{{component.title}}
          </router-link>
        </li>
      </ul>
    </div>
    <div class="summary-block">
      <div v-if="summary.components">Встречается в контекстах:</div>
      <ul class="contexts">
        <li class="contexts" v-for="context in summary.contexts" :key="context.id">
          <router-link
              :to="`/architect/contexts/${context.id}`">{{context.title}}
          </router-link>
        </li>
      </ul>
    </div>
  </v-container>
</template>

<script>

import query from "../../manifest/query";
import jsonata from "jsonata";
import manifest_parser from "../../manifest/manifest_parser";

export default {
  name: 'TRTechniques',
  components:{
  },
  mounted() {
  },
  methods: {},
  computed: {
    summary () {
      return (jsonata(query.summaryForTechnology(this.technology))
          .evaluate(this.$store.state.manifest[manifest_parser.MODE_AS_IS]) || [])
    }
  },
  props: {
    technology: String
  },
  data() {
    return {
    };
  }
};
</script>

<style scoped>

  .summary-block {
    margin-top: 16px;
  }

</style>
