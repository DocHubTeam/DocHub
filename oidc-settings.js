/*
Copyright (C) 2023 Sber

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Maintainers:
    Vladislav Markin, Sber

Contributors:
    Vladislav Markin, Sber - 2023
    Nikolay Temnyakov, Sber - 2024
*/

import {Log, UserManager} from 'oidc-client-ts';

Log.setLogger(console);
Log.setLevel(Log.ERROR);

const url = window.location.origin;

export const settings = {
    authority: process.env.VUE_APP_DOCHUB_AUTHORITY_SERVER,
    client_id: process.env.VUE_APP_DOCHUB_AUTHORITY_CLIENT_ID,
    redirect_uri: new URL('/login', url),
    post_logout_redirect_uri: new URL('/logout', url),
    response_type: 'code',
    scope: 'openid',
    response_mode: 'fragment',
    automaticSilentRenew: true
};

export {
    Log,
    UserManager
};
