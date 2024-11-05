  /*
    Copyright (C) 2022 Sber
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
      Navasardyan Suren, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
  */

<script>
  import errConstants from '@front/constants/errConstants.json';

  export default {
    functional: true,
    render(createElement, context) {
      return createElement('section', { class: 'errorSection' }, [
        createElement('h1', errConstants.LOAD_ERROR),
        createElement('p', {
          domProps: {
            innerHTML: context.data.error
          }
        })
      ]);
    }
  };
</script>

<style scoped>
  .errorSection {
    top: 5%;
    color: #FF0000;
    text-align: center;
    position: relative;
  }

  .errorSection p {
    white-space: pre;
  }
</style>
