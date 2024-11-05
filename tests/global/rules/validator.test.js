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
import validator from '@global/rules/validators.mjs';
import dataset from '@global/datasets/driver.mjs';
import manifest from '../__mocks__/manifest.json';
import validatorFixtures from '../__fixtures__/validators.json';

describe('rules', () => {
  const problems= [];
  const pushProblems = validator => {
    problems.push(validator);
  };

  it('[validator]: Должен обработать без ошибок', done => {
    expect.assertions(1);
    expect(validator(dataset, manifest, pushProblems, pushProblems)).toBeUndefined();

    setTimeout(() => {
      expect.assertions(2);
      expect(problems).toEqual(validatorFixtures);

      done();
    });
  });
});
