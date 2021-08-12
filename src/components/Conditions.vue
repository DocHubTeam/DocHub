<template>
  <v-container
      fluid
      class="lighten-4"
  >
    <v-row>
      <v-col cols="6">
        <source-selector v-model="sourceURI"></source-selector>
      </v-col>
      <v-col cols="6">
        <source-selector v-model="targetURI"></source-selector>
      </v-col>
    </v-row>
    <v-row align="center">
      <v-col cols="12" class="text-center">
        <v-btn
            large
            color="success"
            @click="goCompare"
            :disabled="isCompareDisable">
          Сравнить
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SourceSelector from './SourceSelector';

export default {
  name: 'Swagger',
  components: {
    SourceSelector
  },
  created() {
    this.sourceURI = this.source ? atob(this.source) : null;
    this.targetURI = this.target ? atob(this.target) : null;
  },
  methods: {
    goCompare() {
      this.$router.push({
        name: 'diff',
        params: {
          source: btoa(this.sourceURI),
          target: btoa(this.targetURI),
          mode: 'default'
        }
      });
    },
  },
  computed: {
    isCompareDisable() {
      return !this.sourceURI || !this.targetURI
          || (this.targetURI.toUpperCase() === 'NULL') || (this.sourceURI.toUpperCase() === 'NULL');
    }
  },
  props: {
    source: String,
    target: String
  },
  data() {
    return {
      sourceURI: null,
      targetURI: null,
    };
  }
};
</script>

<style>

.v-application code {
  background-color: transparent;
  -webkit-box-shadow: none;
  box-shadow: none;
}

</style>
