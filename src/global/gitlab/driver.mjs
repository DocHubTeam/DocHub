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

export default function(config) {
	this.axiosInterceptor = async(params) => {
		if (config.gitlab_server && ((new URL(params.url)).host === (new URL(config.gitlab_server)).host)) {
			if (!params.headers) params.headers = {};
			// eslint-disable-next-line no-undef
			params.headers['Authorization'] = `Bearer ${config.personalToken || Vuex?.state?.access_token}`;
		}
		return params;
	};
	// Вспомогательные функции
	this.parseHashParams = (hash) => {
		let hashParams = {};
		let a = /\+/g,  // Regex for replacing addition symbol with a space
			r = /([^&;=]+)=?([^&;]*)/g,
			d = function(s) {
				return decodeURIComponent(s.replace(a, ' '));
			},
			e = r.exec(hash);

		if (e) {
			hashParams[d(e[1])] = d(e[2]);
		}

		return hashParams;
	};

	this.parseURI = (uri) => {
		let url = new URL(uri);
		let result = {
			branch: url.searchParams.get('ref'),
			project: 1 * url.pathname.split('/')[4],
			file: decodeURIComponent(
				url.pathname.split('/repository/files/')[1].replace('/raw', '')
			)
		};
		return result;
	};

	this.isGitLabURI = (uri) => {
		let gitlab_server = new URL(config.gitlab_server);
		let uri_server = new URL(uri);
		return gitlab_server.hostname === uri_server.hostname;
	};

	this.projectLanguagesURI = (ProjectID) => {
		return new URL(`api/v4/projects/${ProjectID}/languages`, config.gitlab_server);
	};

	this.projectsListURI = (page) => {
		return new URL(`api/v4/projects?simple=1&page=${page}`, config.gitlab_server);
	};

	this.projectSingleURI = (id) => {
		return new URL(`api/v4/projects/${id}?simple=1`, config.gitlab_server);
	};

	this.branchesListURI = (project, page) =>{
		return new URL(`api/v4/projects/${project}/repository/branches?pagination=keyset&per_page=100&order_by=name&page=${page}`,
			config.gitlab_server);
	};

	this.commitsListURI = (project, branch, page, file, page_limit) => {
		return new URL(
			`api/v4/projects/${project}/repository/commits?pagination=keyset`
            + '&per_page=' + (page_limit ? page_limit : 100) + `&order_by=name&page=${page}&ref_name=${branch}`
            + (file ? '&path=' + encodeURIComponent(file) : '')
			, config.gitlab_server);
	};

	this.makeFileURI = (projectID, source, branch, view_type) => {
		return new URL(
			`api/v4/projects/${projectID}/repository/files/`
            + encodeURIComponent(source)
            + (view_type ? `/${view_type}` : '')
            + (branch ? `?ref=${branch}` : '')
			, config.gitlab_server
		);
	};
};
