<template>
  <VAutocomplete
    v-model="branch"
    :items="items"
    :loading="isLoading"
    :search-input.sync="search"
    color="white"
    hide-no-data
    hide-selected
    item-text="name"
    item-value="name"
    label="Branch"
    placeholder="Начни вводить название branch"
    prepend-icon="mdi-database-search"
    return-object
  />
</template>

<script>
    import GitHelper from "../helpers/gitlab";
    const axios = require('axios');

    export default {
        name: 'Branches',
        props: {
            project: Number,
            value: Object
        },
        data () {
            return {
                isLoading: false,
                search: null,
                items: [],
                branch: null
            };
        },
        watch: {
            project () {
                this.fetchBranches();
            },
            branch(value) {
                this.$emit('input', value);
            }
        },
        mounted () {
            this.fetchBranches();
        },
        methods: {
            fetchBranches () {
                this.items = [];
                let feetch = (page) => {
                    axios({
                        method: 'get',
                        url: GitHelper.branchesListURI(this.project, page),
                        headers: {'Authorization': `Bearer ${this.$store.state.access_token}`}
                    })
                        .then((response) => {
                            this.items = this.items.concat(response.data);
                            let next_page = response.headers['x-next-page'];
                            if(next_page)
                                feetch(next_page);
                            else
                                this.items.sort();
                        })
                        .catch((error) => {
                            // eslint-disable-next-line no-console
                            console.error(error);
                        });
                };
                feetch(1);
            }
        }
    };
</script>

<style>

    .swagger-ui .info {
        display: none;
    }

    .swagger-ui .info {
        border-radius: 3px;
    }
    .swagger-ui .info .title {
        margin-left: 24px;
        margin-top: 24px;
        display: block;
        font-size: 24px!important;
        color: #fff;
    }

    .swagger-ui .info .url {
        margin-left: 24px;
        margin-top: 8px;
        display: block;
        font-size: 16px!important;
        color: #fff;
    }

    .swagger-ui .info .main {
        background: #3495db;
    }

</style>
