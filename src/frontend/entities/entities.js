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
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
      Vladislav Markin, Sber - 2023
  */


import {BaseEntities} from '@global/entities/entities.mjs';
import env from '@front/helpers/env';
import crc16 from '@global/helpers/crc16';
import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';
import query from '@front/manifest/query';
import yaml from 'yaml';
import masterSchema from '!!raw-loader!@assets/master-schema.yaml';

let appliedSchemaCRC = null;

class FrontEntities extends BaseEntities {

  // Подключает мастер-схему для подсказок и валидации метамодели
  getMasterSchema() {
    return yaml.parse(masterSchema);
  }

  async queryEntitiesJSONSchema(manifest) {
    return query
      .expression(query.entitiesJSONSchema())
      .evaluate(manifest || {});
  }

  // Генерирует список доступных типов документов
  makeDocTypesEnum() {
    const result = [];
    try {
      for (const id in DocTypes) {
        result.push(DocTypes[id]);
      }
      window?.DocHub?.documents?.fetch().map((item) => result.push(item));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error of building of document types enumeration!');
      // eslint-disable-next-line no-console
      console.error(e);
    }
    return {
      '$doc-types': {
        type: 'string',
        enum: result
      }
    };
  }
}

// Регистрирует кастомные сущности
export default function(manifest) {
  const entities = new FrontEntities();
  entities.registerEntities(entities);
  entities.setManifest(manifest);

  if (env.isPlugin()) {
    entities.loadSchema().then((schema) => {

      entities.updateSchema(schema);

      const schemaString = JSON.stringify(schema);
      // Считаем контрольную сумму
      const crc = crc16(schemaString);
      // Отправляем в плагин только если схема изменилась
      if (crc !== appliedSchemaCRC) {
        window.$PAPI.applyEntitiesSchema(schemaString);
        appliedSchemaCRC = crc;
      }

      // eslint-disable-next-line no-console
    }).catch((e) => console.error(e));
	} else {
    void entities.reloadSchema();
  }
}
