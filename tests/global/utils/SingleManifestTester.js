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


export class SingleManifestTester {
  constructor(manifest, mergeMap) {
    this.manifest = manifest;
    this.mergeMap = mergeMap;
  }

  get toStringify() {
    if (this.manifest && this.mergeMap) {
      return {
        manifest: JSON.stringify(this.manifest),
        mergeMap: JSON.stringify(this.mergeMap)
      };
    }

    return null;
  }

  equals(fixture) {
    const curStringifyInstance = this.toStringify;
    const fixtureStringifyInstance = fixture.toStringify;

    if (!curStringifyInstance || !fixtureStringifyInstance) {
      return false;
    } else if (curStringifyInstance.mergeMap === fixtureStringifyInstance.mergeMap) {
      return curStringifyInstance.manifest === fixtureStringifyInstance.manifest;
    }

    return false;
  }
}
