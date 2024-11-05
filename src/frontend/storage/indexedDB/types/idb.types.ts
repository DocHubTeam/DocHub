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


export type TIdbEvent = Event & { target: IDBOpenDBRequest };
export type TIdbRequest = Event & { target: IDBRequest };
export type TOnupgradeneeded = (event: IDBVersionChangeEvent, isUpgrade?: boolean) => void;

export type TKeyOptions = {
  autoIncrement?: boolean;
  keyPath?: string | string[] | null;
}

export type TIndexes = {
  name: string;
  keyPath: string | string[];
  options?: {
    multiEntry?: boolean;
    unique?: boolean;
  };
}

export type TCacheData = {
  id: string;
  eTag: string;
  data: any;
}

export type TManifestProps = {
  original: any;
  merged: any;
};

export type TCacheMethod = 'get' | 'GET' | 'head' | 'HEAD' | null;

export type TLastCachedResult = {
  lastCachedResult: TCacheData,
  reRequest?: boolean
};

export type TAxios<T> = T & TLastCachedResult;

export enum KEYS {
  Manifest = 'Manifest'
}
