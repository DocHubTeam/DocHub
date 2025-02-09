/*
Copyright (C) 2023 Sber
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
    Navasardyan Suren, Sber - 2023
    Vladislav Nefedov, Sber - 2023
	  R.Piontik <r.piontik@mail.ru> - 2023
	  R.Piontik <r.piontik@mail.ru> - 2024
*/


// eslint-disable-next-line no-var
declare var DochubVsCodeExt: {
  metamodelUri: {
    $mid: number;
    authority: string;
    path: string;
    scheme: string;
  };

  rootManifest: string,
  settings: {
    isEnterprise: boolean,    // Признак использования фронта в плагине как Enterprise портала
    enterpriseServer?: string,
    render: {
      external: boolean,
      mode: string,
      request_type: string,
      server: string
    };
    env: {                    // Переменные среды для IDE режима
      DOCHUB_IDE_GITLAB_URL?: string,     // gitlab сервер для режима IDE
      DOCHUB_IDE_BITBUCKET_URL?: string,  // bitbacket сервер для режима IDE
      DOCHUB_IDE_PERSONAL_TOKEN?: string, // персональный токен для gitlab/bitbacket
    };
  }
};

// eslint-disable-next-line no-var
declare var DocHubIDEACodeExt: {
  rootManifest: string,       // Корневой манифест (с чего начинается загрузка)
  settings: {
    [x: string]: {};
    isEnterprise: boolean,    // Признак использования фронта в плагине как Enterprise портала
    enterpriseServer?: string,
    render: {
      external: boolean,      // Признак рендера на внешнем сервере
      mode: string,           // Режим рендера ELK / Smetana / GraphVis
      request_type: string,   // Тип запросов к сервер рендеринга POST / GET
      server: string          // Сервер рендеринга
    };
    env: {                    // Переменные среды для IDE режима
      DOCHUB_IDE_GITLAB_URL?: string,     // gitlab сервер для режима IDE
      DOCHUB_IDE_BITBUCKET_URL?: string,  // bitbacket сервер для режима IDE
      DOCHUB_IDE_PERSONAL_TOKEN?: string, // персональный токен для gitlab/bitbacket
    };
  }
};

declare const vscode: {
  postMessage: ({
    command,
    content
  }: {
    command: string,
    content: any
  }) => Promise<any> | void
};

interface Window { $PAPI: any; }
