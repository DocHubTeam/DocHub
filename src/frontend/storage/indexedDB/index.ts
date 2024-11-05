  /*
  Copyright (C) 2022 Sber
  Copyright (C) 2023 Roman Piontik R.Piontik@mail.ru

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
      Navasardyan Suren, Sber

  Contributors:
      Navasardyan Suren, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
  */


import * as cache from './cache';
import env from '@front/helpers/env';

export type TCache = typeof cache;

export type TIdbState = {
  cache: TCache
} | null;

export default (async(): Promise<TIdbState> => {
  if (!self.indexedDB) {
    console.warn('[indexedDB]: Браузер не поддерживает indexedDB!');
  } else if (!env.cache) {
    console.warn('[indexedDB]: Кэширование отключено.');
  } else {
    /**
     * Таблицы инициализировать здесь
     * Пример: await exampleTable.init();
     */
    await cache.init();

    /**
     * Вернуть инициализированные таблицы(добавить в объект)
     * Пример: return { cache, ...,  exampleTable, ..., }
     */
    return {
      cache
    };
  }

  return null;
})();
