/*
Copyright (C) 2024 Sber

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
    Nikolay Temnyakov, Sber

Contributors:
    Nikolay Temnyakov, Sber - 2024
*/

import cache from "../storage/cache.mjs";

export const DEFAULT_ROLE = 'default';

export async function getCurrentRuleId(rules) {
    if(rules.length === 0) return 'default';

    const ids = [];

    const {URI} =  global.$roles;
    const url = new URL(URI);
    const response = await cache.request(url, '/');

    const manifest = response && (typeof response.data === 'object'
        ? response.data
        : JSON.parse(response.data));


    for(let rule in rules) {
        for(let nRule in manifest?.roles) {
            if(rules[rule] === nRule) {
                ids.push(nRule)
            }
        }
    }

    return ids.sort((a,b) => {return a.localeCompare(b);}).join('');
}

export async function getCurrentRules(rules) {
    if(rules.length === 0) return [];

    const result = [];
    const {URI} =  global.$roles;
    const url = new URL(URI);
    const response = await cache.request(url, '/');

    const manifest = response && (typeof response.data === 'object'
        ? response.data
        : JSON.parse(response.data));

    for(let rule in rules) {
        for(let nRule in manifest?.roles) {
            if(rules[rule] === nRule) {
                result.push(nRule);
            }
        }
    }
    return result;
}

export const newManifest = (obj, exclude, filters)=> Object.entries(obj)
    .filter(([key, value]) => (typeof value != 'object' || Array.isArray(value) || matchExclude(key, exclude)) || matchRegex(key, filters))
    .reduce((acc, [key, value]) => {
        if(value != null && typeof value === 'object' && !Array.isArray(value)) {
            acc[key] = newManifest(value, exclude, filters);
            return acc;
        }
        return Array.isArray(obj) ?  [...acc, ...obj] : ({...acc, [key]: obj[key]});
    }, {});

export async function loader(uri) {
    const response = await cache.request(uri, '/');
    return response && (typeof response.data === 'object'
        ? response.data
        : JSON.parse(response.data));
}

export function isRolesMode() {
    const {MODE} =  global.$roles;
    return (MODE || 'N').toUpperCase() === 'Y';
}

function matchRegex(string, filters){

    const len = filters.length;

    for (let i = 0; i < len; i++) {
        if (string.match(filters[i])) {
            return true;
        }
    }
    return false;
};

function matchExclude(string, exclude) {
    const len = exclude.length;

    for (let i = 0; i < len; i++) {
        if (string === exclude[i]) {
            return true;
        }
    }
    return false;
}




