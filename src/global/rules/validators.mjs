  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

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
  */

const THEAD_LIMIT = 3;

// Выполняет валидаторы и накладывает исключения
export default function(datasets, manifest, success, reject) {
	const rules = manifest?.rules || {};
	const validators = rules?.validators || {};
	const exceptions = rules?.exceptions || {};

	let stop = false;
	const context = {
		stop: () => stop = true,
		stack: Object.keys(validators)
	};

	const runValidator = (id) => {
		datasets.getData(manifest, Object.assign({ _id: id }, validators[id]))
			.then((items) => {
				!stop && success({
					id,
					title: validators[id].title || id,
					items: (items || []).map((item) => {
						return Object.assign({
							exception: exceptions[item.uid]
						}, item);
					})
				});
			}).catch((error) => {
				!stop && reject(
					{
						id,
						title: validators[id].title || id,
						error,
						items: [
							{
								uid: id,
								title: 'Критическая ошибка валидатора!',
								correction: 'Исправьте ошибку в запросе валидатора',
								description: error.message
							}
						]
					}
				);
			}).finally(() => {
				const nextId = context.stack.pop();
				if (nextId && !stop) setTimeout(() => runValidator(nextId), 50);
			});
	};

	for (let id, i = 0; (i < THEAD_LIMIT) && (id = context.stack.pop()) && !stop; i++) {
		runValidator(id);
	}

	return context;
}
