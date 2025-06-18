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
      Navasardyan Suren, Sber - 2023

  Contributors:
      Navasardyan Suren, Sber - 2023
  */

import env from '@front/helpers/env';

/**
 * Очень Важно соблюдать порядок!
 *
 * 1. Инициализация параметров env
 * 2. Загрузка основного приложения(компоненты, vue, итп)
 * 3. Инициализация api плагинов
 * 4. Пулл-инициализация зарегистрированных плагинов
 *
 * !! Lazy Loading юзать только через "жадное-жесткое потребление"(eager), отдельные chunk-и не нужны после билда
 *
 * @param processEnv
 */
const init = async(processEnv) => {
  env.dochub = processEnv ?? {};

  const { default: app } = await import(/* webpackMode: "eager" */ './index');

  await import(/* webpackMode: "eager" */ '@front/plugins/api');

  return app;
};

export { init };
