/*
Copyright (C) 2022 Sber

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
*/

import {expect} from '@jest/globals';

export const checkIdbIdType = (id: string | number): void => {
  const checked: string =
    typeof id === 'number'
      ? id + ''
      : typeof id !== 'string'
        ? ''
        : id;

  expect(checked).toBeTruthy();
};
