/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
Copyright (C) 2024 Sber

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
    R.Piontik <R.Piontik@mail.ru>

Contributors:
    R.Piontik <R.Piontik@mail.ru> - 2023
    Nikolay Temnyakov, Sber - 2024
*/

// Подключаем переменные среды
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.$paths = {
    public: path.resolve(__dirname, '../../../public/'),
    dist: path.resolve(__dirname, '../../../dist/'),
    file_storage: (
        process.env.VUE_APP_DOCHUB_BACKEND_FILE_STORAGE 
        ? path.resolve(process.env.VUE_APP_DOCHUB_BACKEND_FILE_STORAGE) 
        : path.resolve(__dirname, '../../../public/')
    )
};

global.$listeners = {
    onFoundLoadingError: process.env.VUE_APP_DOCHUB_BACKEND_EVENT_LOADING_ERRORS_FOUND
};

global.$roles = {
    MODE: process.env.VUE_APP_DOCHUB_ROLES_MODEL,
    URI: process.env.VUE_APP_DOCHUB_ROLES
}

export default dotenv;
