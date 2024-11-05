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


import { TIdbEvent, TIndexes, TOnupgradeneeded } from '../types/idb.types';
import { iDbIndexesIsEqual } from '../helpers/util';
import { BlockedIndefinitelyException, ErrorStatus } from '../helpers/Exception';

const _db: { [key: string]: IDBDatabase } = {};

const open = async({ ...props }: {
  dbName: string;
  storeName: string;
  version?: number;
  onupgradeneeded?: TOnupgradeneeded;
  indexes?: TIndexes[];
  isUpgrade?: boolean;
}): Promise<IDBDatabase> => {
  await close(props.dbName);

  return new Promise((resolve, reject): void => {
    if (!props.storeName) {
      return reject(new Error(ErrorStatus.unknownStoreName));
    }

    const req: IDBOpenDBRequest = indexedDB.open(props.dbName, props.version);

    req.onsuccess = async(event: TIdbEvent): Promise<void> => {
      const result: IDBDatabase = event.target.result;
      const upgrade = async(): Promise<void> => resolve(
        await open({
          ...props,
          isUpgrade: true,
          version: result.version + 1
        })
      );

      _db[props.dbName] = result;

      if (result.objectStoreNames.contains(props.storeName)) {
        if (props.indexes && !props.isUpgrade) {
          const transaction: IDBTransaction = result.transaction(props.storeName, 'readonly');
          const objectStore: IDBObjectStore = transaction.objectStore(props.storeName);

          transaction.abort();

          if (!iDbIndexesIsEqual(objectStore.indexNames, props.indexes)) {
            return await upgrade();
          }
        }

        return resolve(result);
      }

      return await upgrade();
    };

    req.onerror = reject;
    req.onblocked = (): void => reject(new BlockedIndefinitelyException());
    req.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
      if (props?.onupgradeneeded) {
        props.onupgradeneeded(event, props.isUpgrade);
      }
    };
  });
};

const close = async(dbName: string): Promise<boolean | void> => {
  const currentDB: IDBDatabase = _db[dbName];

  if (currentDB) {
    currentDB.close();
    delete _db[dbName];

    return Promise.resolve(true);
  } else {
    return Promise.resolve();
  }
};

const deleteDB = async(dbName: string): Promise<Event> => {
  await close(dbName);

  return new Promise((resolve, reject): void => {
    const dbConnect: IDBOpenDBRequest = indexedDB.deleteDatabase(dbName);

    dbConnect.onsuccess = resolve;
    dbConnect.onerror = reject;
  });
};

const get = (dbName: string): Promise<Awaited<IDBDatabase>> | Promise<IDBDatabase> => {
  const currentDB: IDBDatabase = _db[dbName];

  if (currentDB) {
    return Promise.resolve(currentDB);
  } else {
    return Promise.reject(new Error(ErrorStatus.invalidDB));
  }
};

const dbVersion = async(dbName: string): Promise<number> => {
  await close(dbName);

  return new Promise((resolve, reject): void => {
    const req: IDBOpenDBRequest = indexedDB.open(dbName);

    req.onsuccess = (event: TIdbEvent): void => {
      const DB: IDBDatabase = event.target.result;

      DB.close();
      resolve(DB.version);
    };

    req.onerror = (event: TIdbEvent) => reject(event.target.error);
    req.onblocked = (): void => reject(new BlockedIndefinitelyException());
  });
};

export {
	open,
	close,
	get,
	deleteDB,
  dbVersion
};
