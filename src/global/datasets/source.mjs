  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

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
      R.Piontik <r.piontik@mail.ru>
  */

export default {
    type(source) {
        if (typeof source === 'string') {
            if (source.startsWith('source:')) {
                return 'resource-inline';
            } else if (/^(\s+|)\(((.*|\d|\D)+?)(\)(\s+|))$/.test(source)) {
                return 'jsonata-query';
            } else if (source.endsWith('.jsonata')) {
                return 'jsonata-file';
            } else if (source.endsWith('.yaml') || source.endsWith('.json') || source.endsWith('.xml')) {
                return 'data-file';
            } else {
                return 'id';
            }
        } else if (typeof source === 'object') {
            return 'data-object';
        } else {
            return undefined;
        }
    }
};
