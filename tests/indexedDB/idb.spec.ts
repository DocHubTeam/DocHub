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

import * as idb from '@front/storage/indexedDB/core/idb';

import { TIdbEvent } from '@front/storage/indexedDB/types/idb.types';
import { dbName, keyOptions } from '@front/storage/indexedDB/cache/config.json';

describe('idb', (): void => {
	describe('openDB', (): void => {
		it(`Должен вернуть DB(${dbName}) типа IDBDatabase`, (): Promise<void> =>
      idb.open({
        dbName,
        storeName: 'example:root',
        onupgradeneeded: (e: IDBVersionChangeEvent): void => {
          (e.target as IDBOpenDBRequest).result.createObjectStore('example:root', keyOptions);
        }
      }).then((db: IDBDatabase): void => {
        expect(db instanceof IDBDatabase).toEqual(true);
        expect(db.name).toEqual(dbName);
      })
    );
	});

	describe('getDB', (): void => {
		it(`Должен вернуть DB(${dbName}) типа IDBDatabase`, (): Promise<void> =>
      idb.get(dbName).then((db: IDBDatabase): void => {
        expect(db instanceof IDBDatabase).toEqual(true);
        expect(db.name).toEqual(dbName);
      })
    );
	});

	describe('closeDB', (): void => {
		it('Должен закрыть DB', (): Promise<void> =>
      idb.close(dbName).then((event: void) => expect(event).toBe(true))
    );
	});

	describe('deleteDB', (): void => {
		it('Должен вернуть undefined', (): Promise<void> =>
      idb.deleteDB(dbName).then((event: TIdbEvent): void =>
        expect(event.target.result).toEqual(undefined)
      )
    );
	});

  describe('dbVersion', (): void => {
    it('Должен вернуть версию DB', (): Promise<void> =>
      idb.dbVersion(dbName).then((version: number): void =>
        expect(version).toEqual(1)
      )
    );
  });
});
