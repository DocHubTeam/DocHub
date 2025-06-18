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
import uriTool from '@global/manifest/tools/uri.mjs';
import config from '../__mocks__/uri/config.json';

describe('uri', (): void => {

  const uri = new uriTool(config);

  it('Должен вернуть сущность URI', (): void =>
    expect(uri.isURL('http://localhost:8080/main')).not.toBeNull()
  );

  it('[isURL]: Должен выдать ошибку', (): void =>
    expect(uri.isURL('main')).toBeNull()
  );

  it('[makeURIByBaseURI]: Должен вернуть сущность URI', (): void =>
    expect(uri.makeURIByBaseURI('entities/root.yaml', 'http://localhost:8080/documentation/root.yaml')).not.toBeNull()
  );

  it('[makeURL]: Должен вернуть сущность URI', (): void =>
    expect(uri.makeURL(
      'archdistrib.puml',
      'http://localhost:8080/documentation/docs/conception/root.yaml'
    )).not.toBeNull()
  );
});
