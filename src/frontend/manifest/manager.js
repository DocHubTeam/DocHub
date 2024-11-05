  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2023 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

          https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      Navasardyan Suren, Sber - 2023
      Vladislav Markin, Sber - 2023
      Vladislav Nefedov, Sber - 2023
  */

import cache from '@front/manifest/cache';
import requests from '@front/helpers/requests';
import env from '@front/helpers/env';

import manifestParserV1 from '@global/manifest/parser.mjs';
import manifestParserV2 from '@global/manifest/parser2.mjs';

const manifestParser = env.isBackendMode() ? manifestParserV1 : manifestParserV2;

manifestParser.cache = cache;

manifestParser.reloadManifest = async function(payload) {
  await manifestParser.startLoad();
  if (payload) {
    await (
      async function parserImport(next = 0) {
        if (payload?.length > next) {
          if (payload[next] === env.rootManifest) {
            await manifestParser.clean();
            /* Подключаем базовую метамодель */
            await manifestParser.import(manifestParser.cache.makeURIByBaseURI(env.uriMetamodel, requests.getSourceRoot()));
          }
          await manifestParser.import(payload[next]);
          await parserImport(next + 1);
        }
      }
    )();
  } else {
    await manifestParser.clean();
    if (!env.isPlugin()) {
      // Подключаем метамодель
      await manifestParser.import(manifestParser.cache.makeURIByBaseURI(env.uriMetamodel, requests.getSourceRoot()));

      // Если необходимо, подключаем документацию DocHub
      env.isAppendDocHubDocs
        && await manifestParser.import(manifestParser.cache.makeURIByBaseURI('/documentation/dochub.yaml', requests.getSourceRoot()));

      let rootManifest = env.rootManifest;

      const user = await window.OidcUserManager.getUser();
      if (user && rootManifest?.endsWith('.yaml')) {
        const role = user.profile?.roles?.filter(role => role.startsWith('dh-'))[0];
        if (role) {
          rootManifest = rootManifest.slice(0, -4) + role + '.yaml';
        }
      }

      // Если корневой манифест указан загружаем
      rootManifest
        && await manifestParser.import(manifestParser.cache.makeURIByBaseURI(rootManifest, requests.getSourceRoot()));
    } else {
      /* Подключаем базовую метамодель */
      await manifestParser.import(manifestParser.cache.makeURIByBaseURI(env.uriMetamodel, requests.getSourceRoot()));

      await manifestParser.import(
        manifestParser.cache.makeURIByBaseURI(env.rootManifest, requests.getSourceRoot()));

      manifestParser.loaded = {};
    }
  }
  await manifestParser.checkAwaitedPackages();
  manifestParser.checkLoaded();

  manifestParser.stopLoad();
};

export default manifestParser;
