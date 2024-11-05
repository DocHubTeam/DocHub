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


import { TIndexes, TKeyOptions } from '../types/idb.types';
import { get as getDB, open as openDB } from './idb';
import { ErrorStatus } from '../helpers/Exception';

const create = async({
  dbName,
  storeName,
  version,
  keyOptions = {},
  indexes = []
}: {
  dbName: string;
  storeName: string;
  keyOptions: TKeyOptions;
  indexes: TIndexes[];
  version?: number;
}): Promise<IDBObjectStore> => {
  let store: IDBObjectStore;

  await openDB({
    dbName,
    storeName,
    version,
    indexes,
    onupgradeneeded(event: IDBVersionChangeEvent, isUpgrade?: boolean): void {
      const DB: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const existStore = DB.objectStoreNames.contains(storeName);

      if (isUpgrade && existStore) {
        DB.deleteObjectStore(storeName);
      }

      if (!existStore) {
        store = DB.createObjectStore(storeName, keyOptions);

        indexes.forEach((index: TIndexes) =>
          store.createIndex(index.name, index.keyPath, index?.options)
        );
      }
    }
  });

  return store;
};

const get = async(dbName: string, storeName: string): Promise<IDBObjectStore> => {
  const DB: IDBDatabase = await getDB(dbName);

  return new Promise((
    resolve: (store: IDBObjectStore) => void,
    reject: (err: Error) => void
  ): void => {
    if (DB.objectStoreNames.contains(storeName)) {
      const transaction: IDBTransaction = DB.transaction(storeName, 'readwrite');
      const store: IDBObjectStore = transaction.objectStore(storeName);

      resolve(store);
    } else {
      reject(new Error(ErrorStatus.invalidStore));
    }
  });
};

const deleteStore = async(
  dbName: string,
  storeName: string,
  version?: number
): Promise<boolean> => {
  await openDB({
    dbName,
    storeName,
    version,
    onupgradeneeded(event: IDBVersionChangeEvent): void {
      const DB: IDBDatabase = (event.target as IDBOpenDBRequest).result;

      if (DB.objectStoreNames.contains(storeName)) {
        DB.deleteObjectStore(storeName);
      }
    }
  });

  return true;
};

const clear = async(dbName: string, storeName: string): Promise<boolean> => {
  const store: IDBObjectStore = await get(dbName, storeName);

  if (store) {
    store.clear();
    return true;
  }
};

const storeCount = async(dbName: string, storeName: string): Promise<number> => {
  const store = await get(dbName, storeName);

  return new Promise((
    resolve: (count: number) => void,
    reject: (err: Event) => void
  ): void => {
    const DB: IDBRequest<number> = store.count();

    DB.onsuccess = (event: Event): void => {
      const count: number = (event.target as IDBRequest).result;
      resolve(count);
    };

    DB.onerror = reject;
  });
};

export {
  create,
  get,
  deleteStore,
  clear,
  storeCount
};
