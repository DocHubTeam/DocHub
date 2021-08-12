<template>
  <v-container
      fluid
      class="lighten-4"
  >
    <v-row dense>
      <v-col
          cols="4"
      >
        <last-changes></last-changes>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import GitHelper from './../helpers/gitlab';
import LastChanges from "./LastChanges";

export default {
  name: 'MainPage',
  components: {LastChanges},
  comments: {
    LastChanges
  },
  methods: {
    goLink(item) {
      this.$router.push({
        name: 'swagger',
        params: {
          source: btoa(item.uri)
        }
      });
    }
  },
  mounted() {
    // eslint-disable-next-line no-debugger
    let hash = GitHelper.parseHashParams(this.$route.hash.substr(1));
    if ('access_token' in hash) {
      this.$store.dispatch('onReceivedOAuthToken', hash.access_token);
    }
  },
  computed: {},
  data() {
    return {};
  }
};
</script>

<style scoped>

</style>
