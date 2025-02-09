/*
Copyright (C) 2022 Sber

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
    Navasardyan Suren, Sber - 2023
*/

import {describe, expect, it} from '@jest/globals';

import * as cache from '@front/storage/indexedDB/cache';

import { checkIdbIdType } from '../helpers/types';

import idbCacheData from '../default/idbCacheData.json';

const TEST_URL = 'TEST_URL';

describe('cache', (): void => {
  describe(
    'init : создать store "example:root"',
    (): void => it('Должен вернуть объект типа IDBObjectStore', (): Promise<void> =>
      cache.init().then((data: IDBObjectStore): void =>
        expect(data).toBeInstanceOf(IDBObjectStore)
      )
    )
  );

  describe(
    'setData : добавить дату в store "example:root"',
    (): void => it('Должен вернуть id', (): Promise<void> =>
      cache.setData(idbCacheData).then(checkIdbIdType)
    )
  );

  describe(
    'putData : обновить дату в store-е "example:root"',
    (): void => it('Должен вернуть id', (): Promise<void> =>
      cache.putData({
        ...idbCacheData,
        id: TEST_URL
      }).then(checkIdbIdType)
    )
  );

  describe(
    'get : получить дату по eTag из store-а "example:root"',
    (): void => it('Должен вернуть объект, где asyncapi="2.0.0"', (): Promise<void> =>
      cache.getData(TEST_URL).then((_data: any): void =>
        expect(_data.data['asyncapi']).toEqual('2.0.0')
      )
    )
  );
});
