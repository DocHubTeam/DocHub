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
    Navasardyan Suren, Sber

Contributors:
    Navasardyan Suren, Sber - 2023
*/


import {describe, expect, it} from '@jest/globals';
import manifestParser from '@global/manifest/parser.mjs';
import frontManifestFixture from '../__fixtures__/front.json';
import cache, {getFullPath, makeBaseManifest} from '../utils/config';
import {SingleManifestTester} from '../utils/SingleManifestTester';
import {manifestTester, mergeMapTester} from '../utils/testers';
import {manifestIsTrue} from '../utils/deepTypeTester';
import '../utils/areSingleManifestTesterEqual';

const URI = {
  mergedData: 'file:///mergeData.yaml',
  singleData: 'file:///singleData.yaml',
  editedData: 'file:///editedData.yaml',
  secondData: 'file:///secondData.yaml',
  parseEntityData: 'file:///parseEntityData.json'
};

describe('Single parser', () => {
  const importManifest = async(uri) => {
    const response = await cache.request(uri, '/');
    return response && (typeof response.data === 'object'
      ? response.data
      : JSON.parse(response.data));
  };

  beforeAll(() => {
    global.$paths = {
      file_storage: getFullPath('../__mocks__/manifest/')
    };
    manifestParser.makeBaseManifest = makeBaseManifest;
    return manifestParser.cache = cache;
  });

  afterEach(() => {
    expect(Object.keys(manifestParser.mergeMap).length).not.toBe(0);
    expect(manifestParser.manifest).not.toBeNull();
    expect(mergeMapTester(manifestParser.mergeMap)).toBeTruthy();
    expect(manifestTester(manifestParser.manifest)).toBeTruthy();
    expect(manifestIsTrue(manifestParser.manifest)).toBeTruthy();
  });

  describe('import', () => {
    it('Должен обработать без ошибок', async() => {
      await expect(manifestParser.import(URI.singleData)).resolves.toBeUndefined();
    });

    it('Если сущности идентичны, должен вернуть true', () => {
      expect(new SingleManifestTester(manifestParser.manifest, manifestParser.mergeMap))
        .not.toEqual(new SingleManifestTester(frontManifestFixture.manifest, frontManifestFixture.mergeMap));
    });

    it('Добавляем еще одну сущность: [Должен обработать без ошибок]', async() => {
      await expect(manifestParser.import(URI.secondData)).resolves.toBeUndefined();
    });

    it('Изменяем сущность: [Должен обработать без ошибок]', async() => {
      await expect(manifestParser.import(URI.editedData)).resolves.toBeUndefined();
    });

    it('Реверт сущности: [Должен обработать без ошибок]', async() => {
      await expect(manifestParser.import(URI.singleData)).resolves.toBeUndefined();
    });
  });

  describe('merge', () => {
    it('[merge]: сущности должны быть идентичны', async() => {
      const mergedData = await manifestParser.merge(
        manifestParser.manifest,
        await importManifest(URI.mergedData),
        URI.mergedData
      );

      expect(new SingleManifestTester(mergedData, manifestParser.mergeMap))
        .not.toEqual(new SingleManifestTester(manifestParser.manifest, frontManifestFixture.mergeMap));
    });

    it('[merge]: сохраняем контекст mergedData и с нуля импортируем в манифест', async() => {
      const mergedData = await manifestParser.merge(
        undefined,
        await importManifest(URI.mergedData),
        URI.mergedData
      );

      expect(mergedData).toEqual(await importManifest(URI.mergedData));
    });

    it('[merge]: сущности не идентичны', async() => {
      const mergedData = await manifestParser.merge(
        [
          'docs/root.yaml',
          'arch/root.yaml',
          'entities/root.yaml',
          '/documentation/root.yaml'
        ],
        [
          'conception/root.yaml',
          'manual/root.yaml'
        ],
        'file:///documentation/docs/root.yaml',
        '/imports'
      );

      expect(mergedData).toEqual([
        'conception/root.yaml',
        'manual/root.yaml',
        'docs/root.yaml',
        'arch/root.yaml',
        'entities/root.yaml',
        '/documentation/root.yaml'
      ]);
    });
  });

  describe('parseEntity', () => {
    it('[parseEntity]: Должен обработать без ошибок', async() => {
      await expect(manifestParser.parseEntity(
        await importManifest(URI.parseEntityData),
        '/docs',
        'file:///documentation/docs/conception/root.yaml'
      )).resolves.toBeUndefined();
    });
  });

  describe('getManifestContext', () => {
    it('[getManifestContext]: Должен обработать без ошибок', () => {
      expect(manifestParser.getManifestContext(URI.singleData))
        .toEqual({
          node: {},
          property: 'singleData.yaml',
          data: undefined
        });
    });
  });

  describe('pushToMergeMap', () => {
    it('[pushToMergeMap]: Должен обработать без ошибок', () => {
      // Рекурсивная(внутри манифеста)
      expect(manifestParser.pushToMergeMap('/docs/dochub.mindmap', {
        description: 'Карта памяти',
        type: 'PlantUML',
        source: 'mindmap.puml'
      }, 'file:///documentation/docs/conception/root.yaml')).toBeUndefined();
    });
  });
});
