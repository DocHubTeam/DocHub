<template>
  <VCard
    max-width="500"
    class="mx-auto"
  >
    <h1>Последние действия</h1>
    <VList
      v-model="lastActions"
      two-line
      subheader
    >
      <VSubheader>Последние действия</VSubheader>
      <VListItem>
        <template v-for="item in items">
          <VListItem :key="item.title">
            <template v-slot:default="{ active, toggle }">
              <VListItemContent>
                <VListItemTitle v-text="item.title" />
                <VListItemSubtitle
                  class="text--primary"
                  v-text="item.headline"
                />
                <VListItemSubtitle v-text="item.subtitle" />
              </VListItemContent>
            </template>
          </VListItem>
        </template>
      </VListItem>
    </VList>
  </VCard>
</template>

<script>

    export default {
        props: {
        },
        data () {
            return {

            };
        },
        computed: {
            lastActions() {
                return [];
            }
        },
        watch: {
        },
        mounted () {
        },
        methods: {
        }
    };
</script>

<style>

</style>
