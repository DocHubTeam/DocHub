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


import { KJUR } from "jsrsasign";

export function getRoles(headers) {
    console.log('headers', headers);
    const jwt = headers?.authorization?.slice(7);

    if (!!jwt && typeof jwt === "string" && !jwt.includes('undefined')) {
        try {
            console.log('headers.authorization', jwt);
            console.log('KJUR.jws.JWS.parse(jwt)',KJUR.jws.JWS.parse(jwt));
            if(KJUR.jws.JWS.verifyJWT(jwt, process.env.VUE_APP_DOCHUB_AUTH_PUBLIC_KEY, {alg: ['RS256']})) {
                return KJUR.jws.JWS.parse(jwt)?.payloadObj?.realm_access?.roles || [];
            } else {
                console.warn(`Verification error: jwt: ${jwt}`);
            }
        } catch (e) {
            console.error('Error getting user groups!');
            // eslint-disable-next-line no-console
            console.error(e);
            return [];
        }
    }
    return [];
}
