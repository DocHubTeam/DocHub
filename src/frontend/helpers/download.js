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
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
  */

import env from '@front/helpers/env';

export default {
    download(encodeURIContent, filename) {
        if (env.isPlugin()) {
            window.$PAPI.download(
              encodeURIContent,
              'Сохранение файла',
              'Выберите файл для сохранения',
              filename.split('.').slice(-1)[0]
            );
          } else {
            const link = document.createElement('a');
            document.body.appendChild(link);
            link.href = encodeURIContent;
            link.download = filename;
            link.click();
            setTimeout(() => document.body.removeChild(link), 50);
          }
    },
    downloadSVGAsPNG(svg, filename) {
        const svgImage = document.createElement('img');
        svgImage.style.position = 'fixed';
        svgImage.style.left = 0;
        svgImage.style.top = 0;
        svgImage.style.zIndex = '-999';
        svgImage.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = svgImage.clientWidth;
          canvas.height = svgImage.clientHeight;
          const canvasCtx = canvas.getContext('2d');
          canvasCtx.drawImage(svgImage, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          document.body.removeChild(svgImage);
          this.download(imgData, filename || `${Date.now()}.png`);
        };
        document.body.appendChild(svgImage);
        const encode = window.btoa(unescape(encodeURIComponent(svg)));
        svgImage.src = `data:image/svg+xml;base64,${encode}`;
    },
    downloadSVG(svg, filename) {
        const encode = window.btoa(unescape(encodeURIComponent(svg)));
        this.download(`data:image/svg+xml;base64,${encode}`, filename  || `${Date.now()}.svg`);
    },
    downloadExcalidraw(json, filename) {
        const encode = window.btoa(unescape(encodeURIComponent(json)));
        this.download(`data:application/json;base64,${encode}`, filename  || `${Date.now()}.excalidraw`);
    }
};
