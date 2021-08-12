import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue';
import Vuex from 'vuex';
import Axios from 'axios';
import Root from './components/Root.vue';
import 'swagger-ui/dist/swagger-ui.css';
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import router from './router';
import VueCookie from 'vue-cookie';

import gitlab from './storage/gitlab';

Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueCookie);

window.Vue = Vue;
Vue.prototype.$axios = Axios;
Vuex.Store.prototype.$axios = Axios;

let store = new Vuex.Store(gitlab);
window.Vuex = store;
store.dispatch('init');

// eslint-disable-next-line no-console
// console.info(config);
// eslint-disable-next-line no-debugger
// debugger;

new Vue(Object.assign({
    el: '#app',
    router,
    vuetify: new Vuetify({
        icons: {
            iconfont: 'mdi', // default - only for display purposes
        },
    }),
    store
}, Root));
