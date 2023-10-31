// Сначала тут минимифицировать https://codebeautify.org/minify-js
// Затем здесь обсфуцировать https://wtools.io/ru/javascript-obfuscator

const ERRORS = {
  OUT_OF_BOUND: 'out-of-bound',
  TRACK_GEN_FAIL: 'track-gen-fail',
  RESTORE_PATH_FAIL: 'restore-path-fail',
  NOT_FOUND_OBJECTS: 'not-found-objects',
  UNDEFINED_SYMBOL: 'undefined-symbol'
};

const MIN_DISTANCE = 80;
const CHAR_WIDTH = 10;

function potpack(boxes, availableWidth) {

  // calculate total box area and maximum box width
  let area = 0;
  let maxWidth = 0;

  for (const box of boxes) {
    area += box.w * box.h;
    maxWidth = Math.max(maxWidth, box.w);
  }

  // Сортировать по высоте, по убыванию
  // boxes.sort((a, b) => b.h - a.h);

  // Стремимся к квадратному контейнеру,
  // скорректированный оптимального использования пространства
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth, availableWidth || 0);

  // Начинаем пустого пространства шириной startWidth, неограниченного снизу
  const spaces = [{x: 0, y: 0, w: startWidth, h: Infinity, boxes:[]}];

  let width = 0;
  let height = 0;
  //let index = 0;
  let processedBoxes = [];

  for (const box of boxes) {
    // box.node.title = ++index;
    // Просматриваем свободные области в обратном порядке, чтобы сначала проверять меньшие
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];

      // Ищем свободное пространство в которое может вместиться текущий ящик
      // if (box.w > space.w || box.h > space.h) continue;
      if ((box.w > space.w) || ((box.h > space.h) && spaces.fixed) ) continue;

      // Если высота очередного блока больше, но по ширине нормально, то раздвигаем его
      // |-------|
      // |  box  |
      // |_______|
      // |   +   |
      // |___+___|
      if ((box.h > space.h) && !spaces.fixed) {
        const delta = box.h - space.h;
        const dy = space.y + space.h;
        const y = space.y;
        spaces.map((item) => {
          if (item.y >= dy) {
            item.y += delta;
          } else if ((item.y >= y) && (item.y + item.h >= dy)) {
            item.h += delta;
          } else if (i) {
            spaces.fixed = true;
          }
        });
      }

      // Подходящее свободно место найдено. Ящик добавляется в его верхний левый угол.
      // |-------|-------|
      // |  box  |       |
      // |_______|       |
      // |         space |
      // |_______________|
      box.x = space.x;
      box.y = space.y;
      processedBoxes.push(box);

      height = Math.max(height, box.y + box.h);
      width = Math.max(width, box.x + box.w);

      if (box.w === space.w && box.h === space.h) {
        // Если пространство полностью утилизировано, удаляем его
        const last = spaces.pop();
        if (i < spaces.length) spaces[i] = last;
      } else if (box.h === space.h) {
        // Пространство соответствует высоте ящика, отрезам от него часть равную ящику справа
        // |-------|---------------|
        // |  box  | updated space |
        // |_______|_______________|
        space.x += box.w;
        space.w -= box.w;
      } else if (box.w === space.w) {
        // Пространство соответствует ширине ящика, отрезам от него часть равную ящику сверху
        // |---------------|
        // |      box      |
        // |_______________|
        // | updated space |
        // |_______________|
        space.y += box.h;
        space.h -= box.h;

      } else {
        // Если ящик не полностью занял пространство, корректируем доступное и создаем "обрезок"
        // |-------|-----------|
        // |  box  | new space |
        // |_______|___________|
        // | updated space     |
        // |___________________|
        spaces.push({
          x: space.x + box.w,
          y: space.y,
          w: space.w - box.w,
          h: box.h
        });
        space.y += box.h;
        space.h -= box.h;
      }
      break;
    }
  }

  return {
    w: width,
    h: height,
    fill: (area / (width * height)) || 0
  };
}

// Движок расчета треков и графа
function core(trackWidth, distance, symbols, isDebug) {
  return {
    // Если в процессе выполнения возникнет ошибка, здесь будут подробности
    error: null,
    // Ширина треков
    trackWidth: trackWidth || 5,
    // Дистанция между объектами
    distance: distance || 50,
    // Размеры символов
    symbols: symbols || {},
    // Здесь накапливаем информацию о реально занятом пространстве диаграммой
    valueBox: {
      x: null,
      y: null,
      dx: null,
      dy: null
    },
    // Фиксирует наличие объекта, который аффектит на область реальной значимости диаграммы
    resetValueBox() {
      this.valueBox = {
        x: null,
        y: null,
        dx: null,
        dy: null
      };
    },

    touchValue(x, y, dx, dy) {
      ((this.valueBox.x === null) || (this.valueBox.x > x)) && (this.valueBox.x = x);
      ((this.valueBox.y === null) || (this.valueBox.y > y)) && (this.valueBox.y = y);
      ((this.valueBox.dx === null) || (this.valueBox.dx < dx)) && (this.valueBox.dx = dx);
      ((this.valueBox.dy === null) || (this.valueBox.dy < dy)) && (this.valueBox.dy = dy);
    },
    // Строим треки
    buildTracks(graph, links) {
      const size = {
        width: Math.round(graph.layers.box.width / this.trackWidth * 1.1),
        height: Math.round(graph.layers.box.height / this.trackWidth * 1.5)
      };

      // Поле расчета волны
      let waveField = {};

      // Проверяем, что точка в области
      const isInSpace = function(x, y) {
        return y >= 0 && x >= 0 && y <= size.height && x <= size.width;
      };

      // Проверяем, что точка не занята
      const isFreeCell = (x, y) => {
        return !waveField[`${y}:${x}`];
      };

      // Получаем значение ячейки волны
      const getCellValue = (x, y) => {
        return waveField[`${y}:${x}`] || 0;
      };

      // Устанавливаем значение ячейки волны
      const setCellValue = (x, y, v) => {
        return waveField[`${y}:${x}`] = v;
      };

      // Уже занятые точки
      let lockedCells = {};

      // Устанавливает пометку на заблокированную ячейку
      const lockCell = (x, y) => {
        return lockedCells[`${y}:${x}`] = true;
      };

      // Проверяет заблокирована ли ячейка
      const isLockedCell = (x, y) => {
        return !!lockedCells[`${y}:${x}`];
      };

      const isBoxAreaOf = (trackRect, x, y, margin) => {
        return (x >= trackRect.x - margin) && (x <= trackRect.dx + margin)
          && (y >= trackRect.y - margin) && (y <= trackRect.dy + margin);
      };

      // Проверка попадают ли координаты в объект
      const isObjectAreaOf = (id, x, y, margin) => {
        const trackRect = graph.map[id].trackRect;
        return isBoxAreaOf(trackRect, x, y, margin);
      };

      const isSymbolAreaOf = (id, x, y) => {
        const trackRect = graph.map[id].symbolTrackRect;
        return isBoxAreaOf(trackRect, x, y, 0);
      };

      // Проверка попадают ли координаты в любой объект за исключением ex
      const isObjectAreaExcept = (ex, x, y) => {
        for(const id in graph.map) {
          // Учитываем только простые объекты (исключаем комплексные)
          if (graph.map[id].symbolTrackRect && isSymbolAreaOf(id, x, y)) return true;
          if (graph.map[id].node.subitems || ex.indexOf(id) >=0 ) continue;
          if (isObjectAreaOf(id, x, y, 1)) return true;
        }
        return false;
      };

      // Поиск пути
      const find = (start, end) => {
        // Если вывалились за поле, уходим
        if(!isInSpace(start.x, start.y) || !isInSpace(end.x, end.y)) {
          return;
          /*
          this.error = {
              code: ERRORS.OUT_OF_BOUND,
              text: `Точки прокладки маршрута вышли за пределы start.x:${start.x}, start.y:${start.y} end.x:${end.x}, end.y:${end.y} width: ${size.width}, height: ${size.height}`
          };
          if (isDebug) {
              // eslint-disable-next-line no-console
              console.error(this.error);
              return;
          } else throw this.error;
          */
        }

        // Аккумулятор волны
        let wave = [{x: start.x, y: start.y}];
        // Объекты исключаемые из обхода волны
        const exObjects = [];

        // Добавляем в исключения id начального и конечного объекта
        // и все вложенные объекты, если это группа
        for(const id in graph.map) {
          if (id.includes(start.id) || id.includes(end.id))
            exObjects.push(id);
        }

        // Делаем шаг
        const doStep = (x, y) => {
          const res = [];

          if(isInSpace(x + 1, y) && isFreeCell(x + 1, y) && !isObjectAreaExcept(exObjects, x + 1, y))
            res.push( { y, x: x + 1, v: getCellValue(x, y) + 1});

          if(isInSpace(x - 1, y) && isFreeCell(x - 1, y) && !isObjectAreaExcept(exObjects, x - 1, y))
            res.push( { y, x: x - 1, v: getCellValue(x, y) + 1});

          if(isInSpace(x, y + 1) && isFreeCell(x, y + 1) && !isObjectAreaExcept(exObjects, x, y + 1))
            res.push( { y: y + 1, x, v: getCellValue(x, y) + 1});

          if(isInSpace(x, y - 1) && isFreeCell(x, y - 1) && !isObjectAreaExcept(exObjects, x, y - 1))
            res.push( { y: y - 1, x, v: getCellValue(x, y) + 1});

          return res;
        };

        // Признак того, что получилось найти путь к объекту
        let isSuccess = false;
        let reserve = []; // Резервные точки с пересечениями треков, используются если не получилось пройти по свободному полю

        // Продолжаем пока есть варианты движения
        while(wave.length && !isSuccess) {
          const points = [];
          for(let i = 0; i < wave.length; i++ ) {
            // Точка сканирования
            const scan = wave[i];
            // Получаем информацию о пространстве вокруг точки
            const landscape = doStep(scan.x, scan.y);
            // Анализируем пространство
            for (let j = 0; j < landscape.length; j++) {
              const point = landscape[j];
              if (point.x === end.x && point.y == end.y) {
                isSuccess = true;
                break;
              }
              if (isLockedCell(point.x, point.y)) {
                setCellValue(point.x, point.y, point.v + 2);
                reserve.push(point);
                continue;
              }
              if(!getCellValue(point.x, point.y)) {
                setCellValue(point.x, point.y, point.v + 1);
                points.push({x: point.x, y: point.y} );
              }
            }
          }
          wave = points;
          // Если свободный маршрут кончился, берем точки из резерва
          if (!wave.length) {
            wave = reserve;
            reserve = [];
          }
        }

        return isSuccess;
      };

      const simplifyPath = function(path) {
        if (path.length < 2) return [];
        const result = [path[0]];
        const len = path.length;
        let oldX = path[0].x;
        let oldY = path[0].y;
        for (let i = 1; i < len; i++) {
          if ((oldX !== path[i].x) && (oldY !== path[i].y)) {
            result.push(path[i-1]);
            result.push(path[i]);
            oldX = path[i].x;
            oldY = path[i].y;
          }
        }
        result.push(path[len - 1]);
        return result;
      };

      // Восстанавливаем маршрут по карте волны
      const restorePath = (start, end) => {
        let path = [];
        let x = end.x;
        let y = end.y;
        // setCellValue(end.x, end.y, -1);
        while ((x !== start.x) || (y !== start.y)) {
          // Параметры оптимального пути
          let minIndex = -1;
          let minSteps = size.width * size.height; // Устанавливаем запредельное значение шагов
          // Прощупываем точки
          const cells = [
            {
              x: - 1,
              y: 0,
              v : getCellValue(x - 1, y)
            },
            {
              x: 0,
              y: - 1,
              v : getCellValue(x, y - 1)
            },
            {
              x: 1,
              y: 0,
              v : getCellValue(x + 1, y)
            },
            {
              x: 0,
              y: 1,
              v : getCellValue(x, y + 1)
            }
          ].map((cell, index) => {
            // Находим оптимальное направление пути
            const detected = (start.x === x + cell.x) && (start.y === y + cell.y);
            if (detected || (cell.v > 0 && cell.v < minSteps)) {
              minIndex = index;
              minSteps = detected ? - 1 : cell.v;
            }
            return cell;
          });

          // Если внезапно закончились варианты, генерируем ошибку
          if (minIndex === -1) {
            this.error = {
              code: ERRORS.TRACK_GEN_FAIL,
              path,
              start,
              end,
              error: {x, y},
              text: `Что-то пошло не так при восстановлении пути для точки ${x}:${y} start: ${start.x}:${start.y}`
            };
            if (isDebug) {
              // eslint-disable-next-line no-console
              console.error(this.error);
              return [];
            } else throw this.error;
          }

          x += cells[minIndex].x;
          y += cells[minIndex].y;
          setCellValue(x, y, -1);

          // Если добрались до целевого объекта прекращаем строить путь
          if (isObjectAreaOf(start.id, x, y, 0)) break;

          //  Если путь проходит через стартовый объект, очищаем пройденный путь
          if (isObjectAreaOf(end.id, x, y, 0))
            path = [];
          else
            path.push({x, y});
        }

        return path;
      };

      // Результат генерации треков
      const tracks = [];

      // Перебираем все связи
      links.map((link) => {
        waveField = {};
        const from = graph.map[link.from];
        const to = graph.map[link.to];
        if (from && to) {
          const start = { id: link.from };
          const end = { id: link.to };
          const border = Math.round(this.trackWidth * 0.5);
          const fromArea = {
            x: Math.round(from.absoluteX + border),
            w: Math.round(from.width - border * 2),
            y: Math.round(from.absoluteY + border),
            h: Math.round(from.height - border * 2)
          };
          const toArea = {
            x: Math.round(to.absoluteX + border),
            w: Math.round(to.width - border * 2),
            y: Math.round(to.absoluteY + border),
            h: Math.round(to.height - border * 2)
          };

          start.y = Math.round((0.5 * fromArea.h + fromArea.y) / this.trackWidth);
          end.y = Math.round((0.5 * toArea.h + toArea.y) / this.trackWidth);
          start.x = Math.round((0.5 * fromArea.w + fromArea.x) / this.trackWidth);
          end.x = Math.round((0.5 * toArea.w + toArea.x) / this.trackWidth);

          // Если путь найден
          if (find(start, end)) {
            const path = restorePath(start, end).map((item) => {
              lockCell(item.x, item.y);
              item.x = Math.round(item.x * this.trackWidth + this.trackWidth * 0.5);
              item.y = Math.round(item.y * this.trackWidth + this.trackWidth * 0.5);
              this.touchValue(item.x, item.y, item.x + 1, item.y + 1);
              return item;
            });
            tracks.push({
              id: `${Math.round(Math.random() * 100000)}:${link.from}${link.style}${link.to}`,
              link,
              path: simplifyPath(path)
            });
          } else {
            this.error = {
              code: ERRORS.RESTORE_PATH_FAIL,
              link,
              text: `Не могу проложить маршрут от ${link.from}${link.style}${link.to}`
            };
            if (isDebug) {
              // eslint-disable-next-line no-console
              console.error(this.error);
              return;
            } else throw this.error;
          }
        } else {
          this.error = {
            code: ERRORS.NOT_FOUND_OBJECTS,
            link,
            text: `Нет объектов для связи [${link.from}${link.style}${link.to}]`
          };
          if (isDebug) {
            // eslint-disable-next-line no-console
            console.error(this.error);
            return;
          } else throw this.error;
        }
      });

      return tracks;
    },

    splitNodesByTag(nodes) {
      const tagMap = {};
      const parentTags = {};

      Object.entries(nodes)
        .forEach(([id, node]) => {
          const domains = [];
          const map = {};
          id.split('.').forEach(domain => {
            domains.push(domain);
            const id = domains.join('.');
            const parentId = domains.slice(0, domains.length-1).join('.');
            if (nodes[id]) {
              if (!nodes[id].tag && parentTags[parentId]) {
                nodes[id].tag = parentTags[parentId];
              }
              map[id] = nodes[id];
              if (nodes[id].tag) {
                parentTags[id] = nodes[id].tag;
                tagMap[node.tag] = {
                  ...tagMap[node.tag],
                  ...map
                };
              } else {
                tagMap['default'] = {
                  ...tagMap['default'],
                  ...map
                };
              }
            }
          });
        });
      return tagMap;
    },

    // Строим граф нод
    // nodes - массив нод
    // links - массив связей
    // availableWidth - доступное пространство по ширине
    buildGraph(nodes, links, availableWidth, marginLeft=0, marginTop=0) {
      // Однонаправленный граф иерархии элементов диаграммы
      const layers = { subitems : {}, symbol: '$landscape' };
      // Карта идентификаторов элементов и их расположения
      const map = {};

      // Разбираем линейный массив в граф
      for (const id in nodes) {
        let head = layers;
        const domains = [];
        id.split('.').map((domain) => {
          domains.push(domain);
          const id = domains.join('.');
          if (!head.subitems[domain]) head.subitems[domain] = {
            id,
            hideTitle: (nodes[id] || {}).hideTitle,
            background: (nodes[id] || {}).background,
            opacity: (nodes[id] || {}).opacity,
            title: (nodes[id] || {}).title || id,
            subitems: {},
            symbol: (nodes[id] || {}).symbol || '$undefined'
          };
          head = head.subitems[domain];
        });
      }

      // Формируем макет
      const revealLayer = (layer, width) => {
        const subitems = [];
        for (const id in layer.subitems) {
          const subitem = layer.subitems[id];
          revealLayer(subitem);
          subitems.push(subitem);
        }
        if (subitems.length) {
          const boxesMap = {};
          let topConnectivity = {
            count: -1,
            id: null
          };

          subitems.map((node) => {
            let maxTitleLen = 0;
            const connectivity = links.filter((item) => {
              if ((item.from === node.id) || (item.to === node.id)) {
                maxTitleLen = Math.max(maxTitleLen, (item.title || '').length);
                return true;
              }
              return false;
            });
            // Выбираем дистанцию учитывая:
            const distance = Math.max(
              Math.round(connectivity.length * trackWidth / 4),   // Количество связей
              MIN_DISTANCE,                                       // Минимальную дистанцию
              maxTitleLen * CHAR_WIDTH                            // Длину текста в связях
            );
            const result = {
              node,
              links: connectivity,
              distance,
              // Учитываем дистанцию
              w: node.box.width + distance,
              h: node.box.height + distance
            };
            if (result.links.length > topConnectivity.count) {
              topConnectivity.count = result.links.length;
              topConnectivity.id = node.id;
            }
            boxesMap[node.id] = result;
          });

          const releaseBoxLinks = (nodeId) => {
            const box = boxesMap[nodeId];
            if (box) {
              boxes.push(boxesMap[nodeId]);
              delete boxesMap[nodeId];
              box.links.map((link) => releaseBoxLinks(link.from) || releaseBoxLinks(link.to));
            }
            return false;
          };

          const boxes = [];
          for(let keys = Object.keys(boxesMap); keys.length ; keys = Object.keys(boxesMap)) {
            if (topConnectivity.id) {
              releaseBoxLinks(topConnectivity.id);
              topConnectivity.id = null;
            } else {
              releaseBoxLinks(keys[0]);
            }
          }

          const symbolBox = (layer.symbol?.startsWith("$") ? undefined : this.symbols[layer.symbol])
            || this.symbols['$landscape'];


          // Считаем оптимальное расположение
          const {w, h} = potpack(boxes, width);

          layer.box = {
            width: Math.max(w, symbolBox.width),
            height: h + symbolBox.height
          };

          layer.boxes = boxes.map((box) => {
            // Определяем фактические координаты объекта
            // Бере не ту дистанцию видимо?
            box.x += box.distance * 0.5;
            box.y += box.distance * 0.5 + symbolBox.height;
            box.width = box.node.box.width;
            box.height = box.node.box.height;
            return map[box.node.id] = box;
          });

          if (symbolBox?.width > 0) { layer.symbolBox = symbolBox; }

        } else {
          layer.box  = this.symbols[layer.symbol];
          if (!layer.box ) {
            layer.box = {x: 0, y: 0, width: 32, height: 32};
            this.error = {
              code: ERRORS.UNDEFINED_SYMBOL,
              text: `Использован недоступный символ "${layer.symbol}"`
            };
            // eslint-disable-next-line no-console
            console.error(this.error);
          }
          delete layer.subitems;
        }
      };

      revealLayer(layers, availableWidth);

      // Пересчет абсолютных координат объектов
      const appendMeta = (boxes, offsetX, offsetY) => {
        for (const id in boxes) {
          const box = boxes[id];
          box.absoluteX = box.x + offsetX;
          box.absoluteY = box.y + offsetY;

          this.touchValue(
            box.absoluteX,
            box.absoluteY,
            box.absoluteX + box.width,
            box.absoluteY + box.height
          );

          box.trackRect = {
            x: box.absoluteX / this.trackWidth,
            y: box.absoluteY / this.trackWidth
          };
          box.trackRect.dx = box.trackRect.x + box.width / this.trackWidth;
          box.trackRect.dy = box.trackRect.y + box.height / this.trackWidth;
          box.node.boxes && appendMeta(box.node.boxes, box.x + offsetX, box.y + offsetY);

          if (box.node.symbolBox) {
            const symbolBox = box.node.symbolBox;
            box.symbolTrackRect = {
              x: box.absoluteX / this.trackWidth,
              y: box.absoluteY / this.trackWidth
            };
            box.symbolTrackRect.dx = box.symbolTrackRect.x + symbolBox.width / this.trackWidth;
            box.symbolTrackRect.dy = box.symbolTrackRect.y + symbolBox.height / this.trackWidth;
          }
        }
      };

      appendMeta(
        layers.boxes,
        this.distance * 0.5 + marginLeft,
        this.distance * 0.5 + marginTop
      );
      // appendMeta(layers.boxes, this.distance * 0.5, this.distance * 0.5);

      return {
        layers,
        map
      };
    }
  };
}


// Построитель графов и треков диаграммы
(function() {
  const kernel = {
    ERRORS,
    // Построить граф и треки
    make(grid, nodes, links, trackWidth, distance, symbols, availableWidth, isDebug) {
      return new Promise((success, reject) => {
        const builder = new core(trackWidth, distance, symbols, isDebug);
        try {
          // - Фильтруем ноды под каждый тег
          // - Раскладываем ноды по гриду
          // - мердж, центровка
          // - прокладываем линки на смерженом графе

          if(!Object.keys(grid).length) {
            console.log(nodes);
            const graph = builder.buildGraph(nodes, links, availableWidth);

            graph.tracks = builder.buildTracks(graph, links);
            graph.valueBox = builder.valueBox;
            success(graph);
          }

          const taggedNodes = builder.splitNodesByTag(nodes);
          const graphs = {};
          let ml = 0;
          let mt = 0;
          let mdx = 0;
          let hasDefault = false;

          const renderGrid = grid => {
            for(let key in grid) {

              Object.entries(grid[key])
                .forEach(([key, node]) => {

                  if(key === 'row') {
                    // next line here
                    renderGrid(node);
                    mt = builder.valueBox.dy;
                    ml = 0;
                    (mdx < builder.valueBox.dx) && (mdx = builder.valueBox.dx);
                    //todo: переделать отрисовку элементов грида без порчи valuebox
                    builder.valueBox.dx = 0;
                  }
                  else {
                    if(Array.isArray(node)) {
                      // and here
                      mt = builder.valueBox.dy;
                      ml = 0;
                      (mdx < builder.valueBox.dx) && (mdx = builder.valueBox.dx);
                      builder.valueBox.dx = 0;

                      renderGrid(node);
                    } else {
                      const tagName = node;
                      if(tagName === 'default')
                        hasDefault = true;
                      const nodes = taggedNodes[tagName];
                      if(nodes) {
                        ml = builder.valueBox.dx;
                        graphs[tagName] = builder.buildGraph(nodes, links, availableWidth, ml, mt);
                        graphs[tagName]['valueBox'] = builder.valueBox;
                      }
                    }
                  }
                });
            }
          };

          renderGrid(grid);

          if(!hasDefault) {
            const tagName = 'default';
            const nodes = taggedNodes[tagName];
            if(nodes) {
              const margin = builder.valueBox.dy;

              graphs[tagName] = builder.buildGraph(nodes, links, availableWidth, ml, mt);
              graphs[tagName]['valueBox'] = builder.valueBox;
              graphs[tagName]['valueBox'].dy = margin;
            }
          }

          const merged =
            Object.values(graphs)
              .reduce((merge, { layers, map }) => {
                  return { ...merge,
                    layers: {
                      symbol: '$landscape',
                      box: {
                        width:
                          merge.layers.box.width
                          + layers.box.width,
                        height:
                          merge.layers.box.height
                          + layers.box.height
                      },
                      boxes: [
                        ...merge.layers.boxes,
                        ...layers.boxes
                      ],
                      subitems: {
                        ...merge.layers.subitems,
                        ...layers.subitems
                      }
                    },
                    map: {
                      ...merge.map,
                      ...map
                    }
                  };
                },
                {
                  layers: {
                    box: {
                      width: 0,
                      height: 0
                    },
                    boxes: [],
                    subitems: {},
                    symbol: '$landscape'
                  },
                  map: {}
                });

          merged.tracks = builder.buildTracks(merged, links);
          (builder.valueBox.dx < mdx) && (builder.valueBox.dx = mdx);
          merged.valueBox = builder.valueBox;

          success(merged);
        } catch (e) {
          reject(e);
        }
      });
    }
  };
  // Если работаем в основном потоке
  if(this.window) {
    window.$SmartAnts = kernel;
  } else { // Если работаем как воркер
    self.addEventListener('message', (message)=> {
      const params = message.data.params;
      const queryID = message.data.queryID;
      kernel.make(
        params.grid,
        params.nodes,
        params.links,
        params.trackWidth,
        params.distance,
        params.symbols,
        params.availableWidth,
        params.isDebug
      ).then((graph) => {
        self.postMessage({
          result: 'OK',
          queryID,
          graph
        });
      }).catch((error) => {
        self.postMessage({
          result: 'ERROR',
          queryID,
          error
        });
      });
    }, false);
  }
})();
