<template>
  <v-container>
    <v-tabs v-model="currentTab">
      <v-tab v-for="tab in problems" :key="tab.title" ripple>
        {{ tab.title }}
      </v-tab>
    </v-tabs>
    <ul v-if="problems.length" style="margin-top: 16px">
      <template v-for="problem in problems[currentTab].problems">
        <li :key="problem.route">
          <router-link v-if="!problem.target"
              :to="problem.route">{{problem.title}}
          </router-link>
          <a v-else :href="problem.route" :target="problem.target">
            {{problem.title}}
          </a>
        </li>
      </template>
    </ul>
  </v-container>
</template>

<script>

export default {
  name: 'Problems',
  computed: {
    problems() {
      const tabs = {};
      this.$store.state.problems.map((item) => {
        !tabs[item.problem] && (tabs[item.problem] = []);
        tabs[item.problem].push(item);
      });

      const result = [];
      for (const tab in tabs) {
        result.push({
          title: tab,
          problems: tabs[tab]
        });
      }
      return result;
    }
  },
  props: {
  },
  data() {
    return {
      currentTab: 0
    };
  }
};
</script>

<style scoped>
</style>
