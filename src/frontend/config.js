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
      R.Piontik <r.piontik@mail.ru>
      Vladislav Markin, Sber - 2023
  */

import env from '@front/helpers/env';

// eslint-disable-next-line no-console
console.info('MAIN ENVIRONMENTS:');

const hiddenEnvs = ['VUE_APP_DOCHUB_CLIENT_SECRET'];

for(const key in env.dochub) {
	// eslint-disable-next-line no-console
	console.info(`  ${key}=`, hiddenEnvs.indexOf(key) < 0 ? JSON.stringify(env.dochub[key]) : '**HIDDEN**');
}

const config = {};

const reloadConfig = () => {
	if (env.gitlabUrl) {
		config.gitlab_server = env.gitlabUrl;

		if (env.personalToken) {
			// Персональный токен генерируемый пользователем
			config.personalToken = env.personalToken;
			config.oauth = false;
		} else {
			// Секреты приложения для OAuth авторизации в GitLab
			if(!env.clientSecret)
				throw 'Not specified the application secret at GitLab (VUE_APP_DOCHUB_CLIENT_SECRET)';

			if(!env.appId)
				throw 'Not specified the application ID at GitLab (VUE_APP_DOCHUB_APP_ID)';

			config.oauth = {
				'APP_ID': env.appId,
				'CLIENT_SECRET': env.clientSecret,
				'REQUESTED_SCOPES': 'read_repository+api'
			};
		}
	} else if (env.bitbucketUrl) {
		if (env.personalToken) {
			// Персональный токен генерируемый пользователем
			config.personalToken = env.personalToken;
			config.bitbucket_server = env.bitbucketUrl;
			config.oauth = false;
		}
	} else {
		// eslint-disable-next-line no-console
		console.warn('Not specified the URL of the GitLab (VUE_APP_DOCHUB_GITLAB_URL) or BitBucket(VUE_APP_DOCHUB_BITBUCKET_URL)');
		config.oauth = false;
	}
};

if (window.$PAPI?.onReloadSetting) window.$PAPI.onReloadSetting = reloadConfig;

reloadConfig();

export default config;
