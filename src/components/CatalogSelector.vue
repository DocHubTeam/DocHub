<template>
  <VAutocomplete
    v-model="selected"
    :items="items"
    hide-no-data
    item-text="name"
    item-value="uri"
    label="Источник"
    placeholder="Выбери из списка документов"
    prepend-icon="mdi-book-open-page-variant"
  />
</template>

<script>
    export default {
        name: 'Catalog',
        props: {
            value: String
        },
        data () {
            return {
                selectedItem: null,
            };
        },
        computed: {
            items() {
                let result = [];
                for(let key in this.$store.state.docs) {
                    let doc = this.$store.state.docs[key];
                    result.push({
                        name : doc.location,
                        uri: doc.uri.toString()
                    });
                }
                return result;
            },
            selected : {
                set(value){
                    this.$emit('input', value);
                    this.selectedItem = value;
                },
                get() {
                    return this.selectedItem;
                }
            }
        },
        watch: {
            value (value) {
                this.selectedItem = value;
            },
        },
        mounted () {
            this.selectedItem = this.value;
        },
        methods: {
        }
    };
</script>

<style>
</style>
