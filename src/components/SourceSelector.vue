<template>
  <div>
    <VRow
      align="center"
      class="source-selector-row"
    >
      <VCol
        cols="12"
        class="source-selector-col"
      >
        <CatalogSelector v-model="catalogURI" />
      </VCol>
    </VRow>
    <VRow
      align="center"
      class="source-selector-row"
    >
      <VCol
        v-if="sourceType === 'GIT'"
        cols="12"
        class="source-selector-col"
      >
        <GitSelector
          v-model="gitURI"
          :base-uri="catalogURI"
        />
      </VCol>
      <VCol
        v-else-if="sourceType === 'WEB'"
        cols="12"
        class="source-selector-col"
      >
        <VTextField
          v-model="catalogURI"
          readonly
          prepend-icon="mdi-web"
        />
      </VCol>
      <VCol
        v-else
        cols="12"
        class="source-selector-col"
      >
        <VTextField
          readonly
          prepend-icon="mdi-help"
        />
      </VCol>
    </VRow>
  </div>
</template>

<script>
    import GitHelper from "../helpers/gitlab";
    import GitSelector from "./GitSelector";
    import CatalogSelector from "./CatalogSelector";

    export default {
        name: 'SourceSelector',
        components: {
            CatalogSelector,
            GitSelector
        },
        props: {
            value: String
        },
        data () {
            return {
                gitURI_: null,
                catalogURI_: null,
            };
        },
        computed : {
            sourceType: {
                get() {
                    try {
                        if(GitHelper.isGitLabURI(this.catalogURI))
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
        created () {
            this.catalogURI = this.value;
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
