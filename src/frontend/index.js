  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2023 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

          https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      Navasardyan Suren, Sber - 2023
      Vladislav Markin, Sber - 2023
  */

// See icons https://fonts.google.com/icons?selected=Material+Icons
import '@assets/styles/material_icons.css';
import '@/node_modules/@mdi/font/css/materialdesignicons.min.css';

// Подсветка синтаксиса
import '@assets/styles/prism.css';
import '@assets/libs/prism';

import Axios from 'axios';
import Vue from 'vue';
import VueCookie from 'vue-cookie';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import '@idea/papi';
import AsyncComputed from 'vue-async-computed';
import VsCode from '@vscode';
import Root from '@front/components/Root.vue';
import router from './router';
import VueSplit from '@assets/libs/vue-split-panel.min';

import Aspect from '@front/components/Architecture/Aspect.vue';
import Component from '@front/components/Architecture/Component.vue';
import Context from '@front/components/Architecture/Context.vue';
import DocHubDoc from '@front/components/Docs/DocHubDoc.vue';
import PlantUML from '@front/components/Schema/PlantUML.vue';
import Radar from '@front/components/Techradar/Main.vue';
import Technology from '@front/components/Techradar/Technology.vue';
import Anchor from '@front/components/Tools/Anchor.vue';
import Image from '@front/components/Tools/Image.vue';
import Youtube from '@front/components/Tools/Youtube.vue';
import Entity from '@front/components/Entities/Entity.vue';
import DocHubObject from '@front/components/Docs/DocHubObject';
import GlobalMixin from '@front/mixins/global';
import gitlab from '@front/storage/gitlab';

import '@assets/styles/main.css';
import '@front/storage/indexedDB';
import 'swagger-ui/dist/swagger-ui.css';
import 'vuetify/dist/vuetify.min.css';
import {UserManager, settings as oidcSettings} from '@/oidc-settings';

window.Vue = Vue;
window.Router = router;
window.EventBus = new Vue();
window.OidcUserManager = new UserManager(oidcSettings);

Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueCookie);
Vue.use(VueSplit);
Vue.use(AsyncComputed);

Vue.prototype.$axios = Axios;
Vuex.Store.prototype.$axios = Axios;

if (window.DochubVsCodeExt) {
  VsCode.pipe();
}

let store = new Vuex.Store(gitlab);

if (window.DochubVsCodeExt) {
  VsCode.listener(store);
}

window.Vuex = store;

store.dispatch('init');

Vue.component('DochubObject', DocHubObject);
Vue.component('DochubDoc', DocHubDoc);
Vue.component('DochubContext', Context);
Vue.component('DochubComponent', Component);
Vue.component('DochubAspect', Aspect);
Vue.component('DochubAnchor', Anchor);
Vue.component('DochubImage', Image);
Vue.component('DochubYoutube', Youtube);
Vue.component('DochubTechnology', Technology);
Vue.component('DochubRadar', Radar);
Vue.component('DochubPlantuml', PlantUML);
Vue.component('DochubEntity', Entity);

Vue.mixin(GlobalMixin);
Vue.config.ignoredElements = ['asyncapi-component'];

const vuetify = new Vuetify({
  icons: {
    iconfont: 'mdi'
  }
});

export default {
  router,
  vuetify,
  store,
  Vue,
  Root
};
