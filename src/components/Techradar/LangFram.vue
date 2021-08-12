<template>
  <g>
    <circle class="ring-arc-3" cx="300" cy="300" r="300"/>
    <circle class="ring-arc-2" cx="300" cy="300" r="260"/>
    <circle class="ring-arc-1" cx="300" cy="300" r="200"/>
    <circle class="ring-arc-0" cx="300" cy="300" r="110"/>
  </g>
</template>

<script>

export default {
  name: 'TRTechniques',
  mounted() {
  },
  methods: {},
  computed: {
  },
  props: {
  },
  data() {
    return {
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

</style>
