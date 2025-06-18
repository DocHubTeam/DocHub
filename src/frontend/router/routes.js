  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2022 Sber

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
      R.Piontik <r.piontik@mail.ru>
      rskabali <rskabali@mts.ru> - 2022
      Vladislav Markin, Sber - 2022
      Vladislav Markin, Sber - 2023
  */

import cookie from 'vue-cookie';

import Doc from '@front/components/Architecture/Document.vue';
import Main from '@front/components/Main';
import config from '@front/config';
import consts from '@front/consts';
import Component from '@front/components/Architecture/Component';
import Aspect from '@front/components/Architecture/Aspect';
import Context from '@front/components/Architecture/Context';
import Radar from '@front/components/Techradar/Main';
import Technology from '@front/components/Techradar/Technology';
import Problems from '@front/components/Problems/Problems';
import Empty from '@front/components/Controls/Empty';
import DevTool from '@front/components/JSONata/DevTool';
import Entity from '@front/components/Entities/Entity';
import SSOError from '@front/components/sso/SSOError';
import oidcClient from '@front/auth/oidc-client';

const middleware = (route) => {
	if (config.oauth !== false && !window.Vuex.state.isOAuthProcess && !window.Vuex.state.access_token) {
      cookie.set('return-route', JSON.stringify({
        path: route.path,
        query: route.query,
        hash: route.hash
      }), 1);
      window.location = new URL(
			`/oauth/authorize?client_id=${config.oauth.APP_ID}`
            + '&redirect_uri=' + new URL(consts.pages.OAUTH_CALLBACK_PAGE, window.location)
            + `&response_type=code&state=none&scope=${config.oauth.REQUESTED_SCOPES}`
            + '&' + Math.floor(Math.random() * 10000)
			, config.gitlab_server
		);
	}

    window.OidcUserManager.getUser().then(user => {
      if (user) {
        // eslint-disable-next-line no-console
        console.log(user.profile.roles);
      }
    });

	return route.params;
};

const login = async function() {
  console.log('window.Vuex',window.Vuex);
  await oidcClient.signinCallback();
};

const routes = [
  {
    name: 'login',
    path: '/login',
    component: Empty,
    props: login
  },
  {
    name: 'logout',
    path: '/logout',
    redirect: { name: 'main' }
  },
  {
    name: 'main',
    path: '/main',
    component: Main,
    props: middleware
  },
  {
    name: 'home',
    path: '/',
    redirect: { name: 'main' }
  },
  {
    name: 'root',
    path: '/root',
    redirect: { name: 'main' }
  },
  {
    name: 'doc',
    path: '/docs/:document',
    component: Doc,
    props: middleware
  },
  {
    name: 'contexts',
    path: '/architect/contexts/:context',
    component: Context,
    props: middleware
  },
  {
    name: 'component',
    path: '/architect/components/:component',
    component: Component,
    props: middleware
  },
  {
    name: 'aspect',
    path: '/architect/aspects/:aspect',
    component: Aspect,
    props: middleware
  },
  {
    name: 'radar',
    path: '/techradar',
    component: Radar,
    props: middleware
  },
  {
    name: 'radar-section',
    path: '/techradar/:section',
    component: Radar,
    props: middleware
  },
  {
    name: 'technology',
    path: '/technology/:technology',
    component: Technology,
    props: middleware
  },
  {
    name: 'problems-subj',
    path: '/problems/:subject',
    component: Problems,
    props: middleware
  },
  {
    name: 'problems',
    path: '/problems',
    component: Problems,
    props: middleware
  },
  {
    name: 'devtool_source',
    path: '/devtool/:jsonataSource(.*)',
    component: DevTool,
    props: middleware
  },
  {
    name: 'devtool',
    path: '/devtool',
    component: DevTool,
    props: middleware
  },
  {
    name: 'entities',
    path: '/entities/:entity/:presentation',
    component: Entity,
    props: middleware
  },
  {
    name: 'ssoerror',
    path: '/sso/error',
    component: SSOError
  },
  {
    name: 'Empty',
    path: '*',
    component: Empty
  }
];

export default routes;
