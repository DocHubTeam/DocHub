<template>
  <svg width="100%" height="90vh" viewBox="0 0 600 600">
    <defs>
      <path d="m0,300 a300,300 0 1,0 600,0 a300,300 0 1,0 -600,0" id="outsideTextPath"></path>
    </defs>
    <g style="opacity: 1; pointer-events: auto;">
      <circle
          v-for="(ring, index) in rings"
          :key="index"
          :class="`ring-arc-${index}`" cx="300" cy="300"
          :r="ring.r"
      />
    </g>
    <template v-if="isShowSections">
      <g v-for="(section, index) in sections" :key="index">
        <line x1="300" y1="300"
              :x2="section.line.x" :y2="section.line.y"
              class="section-line"
        />
        <text class="section-title" text-anchor="middle" @click="onClickSection(section)">
          <textPath :startOffset="`${(section.title.angle / 360 * 100 + 25)%100}%`" xlink:href="#outsideTextPath">
            {{section.title.title}}
          </textPath>
        </text>
      </g>
    </template>
    <g style="opacity: 1; pointer-events: auto;">
      <text class="line-text" y="304" x="300" text-anchor="middle">Adopt</text>
      <text class="line-text" y="304" x="450" text-anchor="middle">Trial</text>
      <text class="line-text" y="304" x="530" text-anchor="middle">Assess</text>
      <text class="line-text" y="304" x="580" text-anchor="middle">Hold</text>
    </g>
    <template v-for="(dot) in dots">
      <g class="dots"
         v-if="!dot.isUnknown"
         :key="dot.item.key"
         :transform="`translate(${dot.position.x}, ${dot.position.y})`"
         @click="onClickDot(dot)"
      >
          <circle class="dot" cx="0" :cy="0" :r="dot.r" :title="dot.item.hint"></circle>
          <text class="dot-text" y="3" x="0" text-anchor="middle">{{dot.index}}</text>
          <title>{{dot.item.key}}: {{dot.item.hint}}</title>
      </g>
    </template>
  </svg>
</template>

<script>

import query from "../../manifest/query";
import jsonata from 'jsonata';
import manifest_parser from "../../manifest/manifest_parser";
import crc16 from "../../helpers/crc16";

export default {
  name: 'TRTechniques',
  mounted() {
  },
  methods: {
    onClickSection(section) {
      this.$router.push({ path: `/techradar/${section.key}` });
    },
    onClickDot(dot) {
      this.$router.push({ path: `/technology/${dot.item.key}` });
    },
    getXY (distance, angle) {
      return {
        x: Math.sin(angle / 360 * 6.28) * distance + 300,
        y: Math.cos(angle / 360  * 6.28) * distance + 300
      }
    },
    makeDot(item, section, ring) {
      const crc = crc16(item.key);
      const ringOffset = ring.r - ring.width;
      return {
        // distance: ringOffset + (crc32 & 0xFFFF0000 / 0x10000 / 0xFFFF * ring.width),
        // angle: section.location.offset + (crc32 & 0xFFFF / 0xFFFF * section.location.size),
        position: this.getXY(
            ringOffset + ((crc & 0xFF00) / 0x100 / 0xFF * ring.width),
            section.location.offset + ((crc & 0xFF) / 0xFF * section.location.size)
        ),
        r: 8,
        item
      }
    },
    getSectionOfKey(key) {
      return this.sections[key];
    },
    getRingOfStatus(status) {
      for(let i=0; i < this.rings.length; i++) {
        const ring = this.rings[i];
        if (ring.key.toLowerCase() === status.toLowerCase()) {
          return ring;
        }
      }
      return null;
    }
  },
  computed: {
    isShowSections() {
      return Object.keys(this.sections).length > 1;
    },
    showSections() {
      let result = {};
      const manifest = this.$store.state.manifest[manifest_parser.MODE_AS_IS];
      if (manifest) {
        if (this.section) {
          manifest.technologies && manifest.technologies && manifest.technologies.sections
          && manifest.technologies.sections[this.section] &&
            (result[this.section] = JSON.parse(JSON.stringify(manifest.technologies.sections[this.section])));
        } else {
          result = JSON.parse(JSON.stringify((manifest.technologies || {sections: {}}).sections));
        }
      }
      return result;
    },
    sections() {
      let result = this.showSections;
      const keys = Object.keys(result);
      if (keys.length) {
        const size = 360 / keys.length;
        let offset = 0;
        for (const key in result) {
          const section = result[key];
          section.key = key;
          section.location = {
            offset,
            size
          };
          section.title = {
            title: section.title,
            position: this.getXY(310, offset + size / 2),
            angle: offset + size / 2
          };
          section.line = this.getXY(300, section.location.offset + size);
          offset += size;
        }
      }
      return result;
    },
    dots() {
      const result = [];
      let index = 1;
      (jsonata(query.collectTechnologies())
          .evaluate(this.$store.state.manifest[manifest_parser.MODE_AS_IS]) || []).map((item) => {
            if (this.section && this.section.toLowerCase() !== item.section.key.toLowerCase())
              return;
            const ring = this.getRingOfStatus(item.status || "trial");
            const section = this.getSectionOfKey(item.section.key);
            if (!section) {
              result.push({
                isUnknown: true,
                item
              });
            } else {
              const dot = this.makeDot(item, section, ring);
              dot.index = index++;
              result.push(dot);
            }
      });
      this.$emit('input', result);
      return result;
    }
  },
  props: {
    section: String
  },
  data() {
    const rings = [
      {
        key: "adopt",
        width: 110
      },
      {
        key: "trial",
        width: 90,
      }
      ,
      {
        key: "assess",
        width: 60,
      },
      {
        key: "hold",
        width: 40
      }
    ];

    rings.reduce((acc, item) => {
      item.r = acc + item.width;
      return item.r;
    }, 0);
    return {
      rings: rings.reverse()
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

svg .section-line {
  stroke: black;
  opacity: 0.3;
}

svg .dot {
  fill: #3495db;
}

svg .dot-text {
  fill: #fff;
  font-size: 10px;
  font-weight: 700;
}

svg .section-title {
  fill: #000;
  cursor: pointer;
}

svg .section-title:hover {
  fill: #BA68C8
}

svg .dots {
  cursor: pointer;
}

svg .dots:hover .dot{
  fill: #BA68C8
}

</style>
