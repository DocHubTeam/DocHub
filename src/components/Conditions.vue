<template>
  <VContainer
    fluid
    class="lighten-4"
  >
    <VRow>
      <VCol cols="6">
        <SourceSelector v-model="sourceURI" />
      </VCol>
      <VCol cols="6">
        <SourceSelector v-model="targetURI" />
      </VCol>
    </VRow>
    <VRow align="center">
      <VCol
        cols="12"
        class="text-center"
      >
        <VBtn
          large
          color="success"
          :disabled="isCompareDisable"
          @click="goCompare"
        >
          Сравнить
        </VBtn>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script>
    import SourceSelector from './SourceSelector';

    export default {
        name: 'Swagger',
        components: {
            SourceSelector
        },
        props: {
            source: String,
            target: String
        },
        data () {
            return {
                sourceURI: null,
                targetURI: null,
            };
        },
        computed : {
            isCompareDisable () {
                return !this.sourceURI || !this.targetURI
                    || (this.targetURI.toUpperCase() === 'NULL') || (this.sourceURI.toUpperCase() === 'NULL');
            }
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
