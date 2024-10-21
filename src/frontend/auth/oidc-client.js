/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

In any derivative products, you must retain the information of
owner of the original code and provide clear attribution to the project

        https://dochub.info

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Maintainers:
    Vladislav Markin <markinvy@yandex.ru>

Contributors:
    Vladislav Markin <markinvy@yandex.ru>
*/


export default {
    login() {
        window.OidcUserManager.signinRedirect()
            .then(() => {
                // eslint-disable-next-line no-console
                console.log('User logged in');
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    },
    logout() {
        window.OidcUserManager.signoutRedirect()
            .then(() => {
                // eslint-disable-next-line no-console
                console.log('User logged out');
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    },
    async signinCallback() {
        if (window.location.hash) {
            await window.OidcUserManager.signinCallback();
            window.location.hash = '';
        } else {
            window.location = window.origin + '/main';
        }
    },
    async getAccessToken() {
      return (await window.OidcUserManager.getUser())?.access_token;
    }
};
