<template>
  <v-container fluid class="lighten-4">
    <v-row dense>
      <v-col cols="12">
        <v-card>
          <schema :schema="schema"></schema>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Schema from '../Schema/Schema';
import jsonata from 'jsonata';
import manifest_parser from "../../manifest/manifest_parser";
import query from "../../manifest/query";

export default {
  name: 'Context',
  components: {
    Schema
  },
  computed: {
    schema () {
      return jsonata(query.context(this.context))
          .evaluate(this.$store.state.manifest[manifest_parser.MODE_AS_IS]);
    }
  },
  props: {
    context: String
  },
  data() {
    return {
    };
  }
};
</script>

<style scoped>

</style>
