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
    Navasardyan Suren, Sber - 2023
*/

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

import {
  TAxios,
  TCacheData,
  TLastCachedResult,
  TCacheMethod,
  KEYS,
  TManifestProps
} from '@front/storage/indexedDB/types/idb.types';

import idb, { TCache } from '@front/storage/indexedDB';
import env from './env';

let Cache: TCache | null;

const useIdbKey = (key: string | object): string => JSON.stringify(key);

const initCache = async(): Promise<void> => {
  if (!Cache) {
    Cache = (await idb)?.cache;
  }
};

export const requestCacheInterceptor = async(
  params: TAxios<AxiosRequestConfig>
): Promise<void> => {
  await initCache();

  if (Cache) {
    if (params.reRequest) {
      params.method = 'GET';
      params.reRequest = false;
    } else {
      const lastCachedResult: TCacheData = await Cache.getData(useIdbKey(params.url));

      if (lastCachedResult && lastCachedResult.eTag) {
        params.method = env.cache as TCacheMethod;
        params.lastCachedResult = lastCachedResult;

        params.headers = {
          ...params.headers,
          'If-None-Match': lastCachedResult.eTag
        };
      }
    }
  }
};

export const responseCacheInterceptor = async(
  response: TAxios<AxiosResponse>
): Promise<AxiosRequestConfig | void> => {
  await initCache();

  if (Cache) {
    if (
      response.config.method.toUpperCase() === 'HEAD' &&
      response.status === 200
    ) {
      (response.config as TLastCachedResult).reRequest = true;
      return response.config;
    }

    if (response.headers.etag) {
      const newCachedData: TCacheData = {
        id: useIdbKey(response.config.url),
        eTag: response.headers.etag,
        data: response.data
      };

      if ((response.config as TLastCachedResult).lastCachedResult) {
        await Cache.putData(newCachedData);
      } else {
        await Cache.setData(newCachedData);
      }
    }
  }
};

export const plantUmlCache: {
  set(umlUrl: string, response: AxiosResponse): Promise<void>;
  get(umlUri: string): Promise<TCacheData>
} = {
  async get(umlUri: string): Promise<TCacheData | null> {
    await initCache();

    if (Cache) {
      const cachedData: TCacheData = await Cache.getData(umlUri);
      return cachedData?.id === umlUri ? cachedData : null;
    }
  },
  async set(umlUri: string, response: AxiosResponse): Promise<void> {
    await initCache();

    if (Cache) {
      const cachedData: TCacheData = await Cache.getData(umlUri);

      const newCachedData: TCacheData = {
        id: umlUri,
        eTag: uuidv4(),
        data: response.data
      };

      if (cachedData) {
        await Cache.putData(newCachedData);
      } else {
        await Cache.setData(newCachedData);
      }
    }
  }
};

export const manifestCache: {
  set(manifest: TManifestProps): Promise<void>;
  get(): Promise<TManifestProps | null>
} = {
  async get(): Promise<TManifestProps | null> {
    await initCache();

    if (Cache) {
      const cachedData: TCacheData = await Cache.getData(KEYS.Manifest);
      return cachedData?.data ?? null;
    }
  },
  async set(manifest: TManifestProps): Promise<void> {
    await initCache();

    if (Cache) {
      const cachedData: TCacheData = await Cache.getData(KEYS.Manifest);

      const newCachedData: TCacheData = {
        id: KEYS.Manifest,
        eTag: uuidv4(),
        data: manifest
      };

      if (cachedData) {
        await Cache.putData(newCachedData);
      } else {
        await Cache.setData(newCachedData);
      }
    }
  }
};
