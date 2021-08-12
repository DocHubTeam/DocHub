<template>
  <v-container style="padding: 0; min-width: 100%">
    <v-row dense>
      <v-col cols="8">
        <radar v-model="technologies" :section="section"></radar>
      </v-col>
      <v-col cols="4">
        <ul class="sections">
          <li v-for="(section, key) in legend" :key="key" class="section-header">
            {{section.section.title}}
            <ul class="section-record">
              <li v-for="record in section.items" :key="record.index">
                <router-link
                    :to="`/technology/${record.item.key}`">
                    {{record.index ? `${record.index}: `: ''}} {{record.item.key}}
                </router-link>
              </li>
            </ul>
          </li>
        </ul>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import Radar from "./Radar";

export default {
  name: 'TRTechniques',
  components:{
    Radar
  },
  mounted() {
  },
  methods: {},
  computed: {
    legend() {
      const result = {};
      this.technologies.map((record) => {
        const section = record.item.section;
        !result[section.key] && (result[section.key] = {section, items: []});
        result[section.key].items.push(record);
      });
      return result;
    }
  },
  props: {
    section: String
  },
  data() {
    return {
      technologies: []
    };
  }
};
</script>

<style scoped>

.section {
  padding: 0;
  height: 40vh;
}

svg circle.ring-arc-0 {
  stroke: none;
  fill: #bababa;
}

svg circle.ring-arc-1 {
  stroke: none;
  fill: #cacaca;
}

svg circle.ring-arc-2 {
  stroke: none;
  fill: #dadada;
}

svg circle.ring-arc-3 {
  stroke: none;
  fill: #eee;
}

svg text.line-text {
  font-weight: 700;
  text-transform: uppercase;
  fill: #000;
  font-size: 12px;
}

ul .section-header {
  margin-bottom: 16px;
}

ul.sections {
  list-style-type: none;
  font-weight: 700;
  font-size: 12px;
}

ul.sections li {
  margin-left: 0px;
}

ul.section-record {
  font-weight: 300;
  list-style-type: none;
  margin-top: 6px;
}

</style>
