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

import * as store from '@front/storage/indexedDB/core/store';
import config from '@front/storage/indexedDB/cache/config.json';

describe('store', (): void => {
  describe('create', (): void => {
    it('Должен создать store "example:root" и вернуть его', (): Promise<void> => {
      return store.create({...config, storeName: 'example:root'}).then((store: IDBObjectStore): void => {
        expect(store instanceof IDBObjectStore).toEqual(true);
        expect(store.name).toEqual('example:root');
      });
    });
  });

  describe('get', (): void => {
    it('Должен вернуть store "example:root"', (): Promise<void> => {
      return store.get(
        config.dbName,
        'example:root'
      ).then((store: IDBObjectStore): void => {
        expect(store instanceof IDBObjectStore).toEqual(true);
        expect(store.name).toEqual('example:root');
      });
    });
  });

  describe('storeCount', (): void => {
    it('Должен вернуть количество сторов', (): Promise<void> => {
      return store.storeCount(
        config.dbName,
        'example:root'
      ).then((count: number): void => expect(typeof count).toEqual('number'));
    });
  });

  describe('clear', (): void => {
    it('Должен вернуть количество store-ов = 0', (): Promise<void> => {
      return store.clear(
        config.dbName,
        'example:root'
      ).then((res: boolean): void => expect(res).toEqual(true));
    });
  });

  describe('deleteStore', (): void => {
    it('Должен удалить store "example:root"', (): Promise<void> => {
      return store.deleteStore(
        config.dbName,
        'example:root'
      ).then((res: boolean): void => expect(res).toEqual(true));
    });
  });
});
