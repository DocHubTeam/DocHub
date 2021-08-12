export default {
    // Ищет манифесты затрагивающие компонент
    getComponentLocations () {
        const result = [];
        window.Vuex.state.sources.map((item) =>
            item.path.slice(0, this.component.length + 12) === `/components/${this.component}` && result.push(item)
        );
        return result;
    }
}
