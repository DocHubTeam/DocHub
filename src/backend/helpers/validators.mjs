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
    R.Piontik <R.Piontik@mail.ru>

Contributors:
    R.Piontik <R.Piontik@mail.ru>
    Nikolay Temnyakov <temnjakovn@gmail.com>
*/

import validators from '../../global/rules/validators.mjs';
import datasets from './datasets.mjs';
import logger from '../utils/logger.mjs';
import {isRolesMode} from "../utils/rules.mjs";

const LOG_TAG = 'validators';

// Выполняет валидаторы и накладывает исключения
export default function(app) {
	app.storage.problems = app.storage.problems || [];
	const pushValidator = (validator) => {
		app.storage.problems.push(validator);
	};
	logger.log('Executing validators..', LOG_TAG);

	let storageManifest = app.storage.manifest;
	if(isRolesMode()) {
		storageManifest = app.storage.manifests[app.storage.roleId];
	}
	validators(datasets(app), storageManifest, pushValidator, pushValidator);
	logger.log('Done.', LOG_TAG);

}
