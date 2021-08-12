<template>
  <div>
    <v-row align="center" class="source-selector-row">
      <v-col cols="12" class="source-selector-col">
        <catalog-selector v-model="catalogURI"></catalog-selector>
      </v-col>
    </v-row>
    <v-row align="center" class="source-selector-row">
      <v-col cols="12" v-if="sourceType === 'GIT'" class="source-selector-col">
        <git-selector :base-uri="catalogURI" v-model="gitURI"></git-selector>
      </v-col>
      <v-col cols="12" v-else-if="sourceType === 'WEB'" class="source-selector-col">
        <v-text-field
            v-model="catalogURI"
            readonly
            prepend-icon="mdi-web"
        ></v-text-field>
      </v-col>
      <v-col cols="12" v-else class="source-selector-col">
        <v-text-field
            readonly
            prepend-icon="mdi-help"
        ></v-text-field>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import GitHelper from "../helpers/gitlab";
import GitSelector from "./GitSelector";
import CatalogSelector from "./CatalogSelector";

export default {
  name: 'SourceSelector',
  created() {
    this.catalogURI = this.value;
  },
  components: {
    CatalogSelector,
    GitSelector
  },
  computed: {
    sourceType: {
      get() {
        try {
          if (GitHelper.isGitLabURI(this.catalogURI))
            return 'GIT';
          else
            return 'WEB';
        } catch (e) {
          return 'UNKNOWN';
        }
      }
    },

    catalogURI: {
      get() {
        return this.catalogURI_;
      },

      set(value) {
        this.catalogURI_ = value;
        this.$emit('input', value);
      }
    },

    gitURI: {
      get() {
        return this.gitURI_;
      },

      set(value) {
        this.gitURI_ = value;
        this.$emit('input', value);
      }
    },
  },
  props: {
    value: String
  },
  data() {
    return {
      gitURI_: null,
      catalogURI_: null,
    };
  }
};
</script>

<style>

.source-selector-row {
  padding-top: 0;
  padding-bottom: 0;
}

.source-selector-col {
  padding-top: 0;
  padding-bottom: 0;
}

</style>
