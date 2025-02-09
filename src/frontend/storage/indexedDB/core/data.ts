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

  */


import { get as getStore } from './store';
import { TCacheData, TIdbRequest } from '../types/idb.types';

const getAll = async<SCHEMA>(
  dbName: string,
  storeName: string
): Promise<SCHEMA[]> => {
  const store: IDBObjectStore = await getStore(dbName, storeName);

  return new Promise((
    resolve: (data: SCHEMA[]) => void,
    reject: (err: never) => void
  ): void => {
    const dataArr: SCHEMA[] = [];
    const req: IDBRequest<IDBCursorWithValue | null> = store.openCursor();

    req.onsuccess = (event: TIdbRequest): void => {
      const cursor: IDBCursorWithValue = event.target.result;

      if (cursor) {
        dataArr.push(cursor.value);
        cursor.continue();
      } else {
        resolve(dataArr);
      }
    };

    req.onerror = reject;
  });
};

const get = async({ ...props }: {
  dbName: string;
  storeName: string;
  indexName: string;
  value: number | string;
}): Promise<TCacheData> => {
  const store: IDBObjectStore = await getStore(props.dbName, props.storeName);

  return new Promise((
    resolve: (data: TCacheData) => void,
    reject: (err: never) => void
  ): void => {
    const index: IDBIndex = store.index(props.indexName);
    const req: IDBRequest = index.get(props.value);

    req.onsuccess = (event: TIdbRequest): void => {
      resolve(event.target.result);
    };

    req.onerror = reject;
  });
};

const add = async(
  dbName: string,
  storeName: string,
  data: TCacheData
): Promise<string | number> => {
  const store: IDBObjectStore = await getStore(dbName, storeName);

  return new Promise((
    resolve: (id: string | number) => void,
    reject: (err: never) => void
  ): void => {
    const req: IDBRequest = store.add(data);

    req.onsuccess = (event: TIdbRequest): void => {
      resolve(event.target.result);
    };
    req.onerror = reject;
  });
};

const put = async(
  dbName: string,
  storeName: string,
  data: TCacheData
): Promise<string | number> => {
  const store: IDBObjectStore = await getStore(dbName, storeName);

  return new Promise((
    resolve: (id: string | number) => void,
    reject: (err: never) => void
  ): void => {
    const req: IDBRequest = store.put(data);

    req.onsuccess = (event: TIdbRequest): void => {
      resolve(event.target.result);
    };

    req.onerror = reject;
  });
};

const deleteByPrimaKey = async(
  dbName: string,
  storeName: string,
  primaryKey: number | string
): Promise<boolean> => {
  const store: IDBObjectStore = await getStore(dbName, storeName);

  if (store) {
    store.delete(primaryKey);
    return true;
  }
};

export {
  getAll,
  get,
  add,
  put,
  deleteByPrimaKey
};
