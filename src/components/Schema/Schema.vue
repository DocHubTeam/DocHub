<template>
  <plantuml class="plantuml-schema"
      :uml = "uml"
  ></plantuml>
</template>

<script>

import PlantUML from "./PlantUML";
import DSL from "!!raw-loader!../../assets/dsl.txt";

export default {
  name: 'Schema',
  components: {
    "plantuml" : PlantUML
  },
  methods: {
    toID(id) {
      return id.replaceAll('@', '_').replaceAll('-', '_');
    },
    makeRef(type, id, title) {
      const url = (() => {
        switch (type) {
          case 'context':
            return (new URL(`architect/contexts/${id}`, location.origin)).toString();
          case 'component':
            return (new URL(`architect/components/${id}`, location.origin)).toString();
          case 'aspect':
            return (new URL(`architect/aspects/${id}`, location.origin)).toString();
        }
      })();
      return `[[${url} ${title || id}]]`;
    },
    makeSchemeStructure() {
      // Структура схемы
      const structure = {
        namespaces: {},
        connections: {}
      };

      // Размещает компонент в структуре схемы
      const expandComponent = (component, override) => {
        const namespace = component.namespace;
        const namespaces = structure.namespaces;
        !namespaces[namespace.id] && (namespaces[namespace.id] = Object.assign(namespace, {components: {}}));
        if (override || !namespaces[namespace.id].components[component.id])
          namespaces[namespace.id].components[component.id] = component;
      }

      (this.schema.components || []).map((component) => {
        // Разбираем компонент
        expandComponent(component, true);
        // Разбираем зависимости компонента
        (component.requires || []).map((require) => {
          expandComponent(require, false);
          structure.connections[`[${this.toID(component.id)}] -- [${this.toID(require.id)}]`] = require;
        });
      });

      return structure;
    }
  },
  computed: {
    uml () {
      let uml = `@startuml\n${DSL}\n`;
      if(this.schema) {
        uml += `title ${this.makeRef('context', this.schema.id, this.schema.title)}\n`;
        // Готовим структуру схемы для рендеринга
        const structure = this.makeSchemeStructure();
        // Разбираем архитектурные пространства
        for (const namespaceID in structure.namespaces) {
          const namespace = structure.namespaces[namespaceID];
          uml += `rectangle "${namespace.title}" {\n`;
          // Формируем компоненты
          for (const componentID in namespace.components) {
            const component = namespace.components[componentID];
            const title = this.makeRef('component', component.id, component.title);
            if (component.aspects && component.aspects.length) {
              uml += `${component.entity} ${this.toID(component.id)}`;
              const aspectList = [];
              component.aspects.map((aspect) => {
                let aspectTitle = this.makeRef('aspect', aspect.id, aspect.title);
                aspectList.push(aspectTitle);
              });
              aspectList.length && (uml += `[\n<b>${title}</b>\n====\n* ${aspectList.join('\n----\n* ')}\n]`);
            } else {
              uml += `${component.entity} "${title}" as ${this.toID(component.id)}`;
            }

            uml += `\n`
          }
          uml += `}\n`
        }
        // Строим связи
        for (const connection in structure.connections) {
          // const require = structure.connections[connection];
          uml += `${connection}: ""\n` //${require.title}
        }
      }
      uml += '@enduml';
      // eslint-disable-next-line no-console
      console.info(uml);
      return uml;
    }
  },
  props: {
    schema: Object
  },
  data() {
    return {
    };
  }
};
</script>

<style scoped>
</style>
