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


function manifestIsTrue(value) {
  return value ? manifestToJson(value).length : undefined;
}

function toManifest(json) {
  return cast(JSON.parse(json), ref('Manifest'));
}

function manifestToJson(value) {
  return JSON.stringify(uncast(value, ref('Manifest')), null, 2);
}

function invalidValue(typ, val, key, parent = '') {
  const prettyTyp = getTypeName(typ);
  const parentText = parent ?? '';
  const keyText = key ? ` для "${key}"` : '';
  throw Error(`Неверное значение${keyText}${parentText}. Ожидается - ${prettyTyp}, исполнено - ${JSON.stringify(val)}`);
}

function getTypeName(typ) {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `необязательно ${getTypeName(typ[1])}`;
    } else {
      return `один из [${typ.map(a => { return getTypeName(a); }).join(', ')}]`;
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ) {
  if (typ.jsonToJS === undefined) {
    const map = {};

    typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
    typ.jsonToJS = map;
  }

  return typ.jsonToJS;
}

function jsToJSONProps(typ) {
  if (typ.jsToJSON === undefined) {
    const map = {};

    typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
    typ.jsToJSON = map;
  }

  return typ.jsToJSON;
}

function transform(val, typ, getProps, key = '', parent = '') {
  function transformPrimitive(typ, val) {
    if (typeof typ === typeof val) {
      return val;
    }

    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs, val) {
    // val must validate against one typ in typs
    const l = typs.length;

    for (let i = 0; i < l; i++) {
      const typ = typs[i];

      try {
        return transform(val, typ, getProps);
        // eslint-disable-next-line no-empty
      } catch (_) {}
    }

    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases, val) {
    if (cases.indexOf(val) !== -1) {
      return val;
    }

    return invalidValue(cases.map(a => { return literal(a); }), val, key, parent);
  }

  function transformArray(typ, val) {
    // val должен быть массивом без недопустимых значений
    if (!Array.isArray(val)) {
      return invalidValue(literal('array'), val, key, parent);
    }

    return val.map(el => transform(el, typ, getProps));
  }

  function transformObject(props, additional, val) {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(literal(ref || 'object'), val, key, parent);
    }

    const result = {};

    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });

    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = val[key];
      }
    });

    return result;
  }

  if (typ === 'any') {
    return val;
  }

  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }

  if (typ === false) {
    return invalidValue(typ, val, key, parent);
  }

  let ref = undefined;

  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }

  if (Array.isArray(typ)) {
    return transformEnum(typ, val);
  }

  if (typeof typ === 'object') {
    // eslint-disable-next-line no-prototype-builtins
    return typ.hasOwnProperty('unionMembers') ? transformUnion(typ.unionMembers, val)
      // eslint-disable-next-line no-prototype-builtins
      : typ.hasOwnProperty('arrayItems')    ? transformArray(typ.arrayItems, val)
        // eslint-disable-next-line no-prototype-builtins
        : typ.hasOwnProperty('props')         ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent);
  }

  return transformPrimitive(typ, val);
}

function cast(val, typ) {
  return transform(val, typ, jsonToJSProps);
}

function uncast(val, typ) {
  return transform(val, typ, jsToJSONProps);
}

function literal(typ) {
  return { literal: typ };
}

function array(typ) {
  return { arrayItems: typ };
}

function union(...typs) {
  return { unionMembers: typs };
}

function object(props, additional) {
  return { props, additional };
}

function merge(additional) {
  return { props: [], additional };
}

function ref(name) {
  return { ref: name };
}

const typeMap = {
  'Manifest': object([
    { json: 'rules', js: 'rules', typ: union(undefined, merge(literal('Rules'))) },
    { json: 'entities', js: 'entities', typ: union(undefined, merge(literal('ManifestEntities'))) },
    { json: 'imports', js: 'imports', typ: union(undefined, array('')) },
    { json: 'docs', js: 'docs', typ: union(undefined, merge(literal('Docs'))) },
    { json: 'datasets', js: 'datasets', typ: union(undefined, merge(literal('Datasets'))) },
    { json: 'components', js: 'components', typ: union(undefined, merge(literal('Components'))) },
    { json: 'contexts', js: 'contexts', typ: union(undefined, merge(literal('Contexts'))) }
  ], false)
};


module.exports = {
  manifestToJson,
  toManifest,
  manifestIsTrue
};
