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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2023
  */

export function Base64ToUTF8(base64) {
  return decodeURIComponent(global.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

export function Base64URLToUTF8(base64url) {

  let base64 = base64url
                        .replaceAll('-', '+')
                        .replaceAll('_', '/');

  switch (base64.length % 4) {
    case 0: break;
    case 2: base64 += '=='; break;
    case 3: base64 += '='; break;
    default: throw new Error(`Illegal base64 safe url string: ${base64url}`);
  }

  return decodeURIComponent(global.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
