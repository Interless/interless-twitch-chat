# Архитектура MVP

## Цели границ

Основной принцип — StreamElements, React и геометрия не должны знать внутреннее устройство друг друга.

```text
StreamElements browser event
  → StreamElementsAdapter (unknown → validated data)
  → NormalizedWidgetEvent
  → overlayReducer
  → React components
  → DOM measurement
  → PlacementEngine (pure geometry)
  → CSS animation
```

## Модули

### `adapters/streamelements`

Единственное место, которое читает `onWidgetLoad` и `onEventReceived`. Граница принимает `unknown`, проверяет обязательные значения и только затем создаёт `ChatMessage` или moderation event.

Adapter поддерживает документированные listener types:

- `message`;
- `delete-message`;
- `delete-messages`.

`raid-latest` намеренно не преобразуется в «роль рейдера». Расширение нормализованных событий возможно без изменения React-компонентов.

### `domain`

Содержит модель чата, fragments, role priority и разрешение ассетов. Приоритет ролей находится только в `ROLE_PRIORITY` и покрыт тестами.

Emote parsing использует `start`/`end` из StreamElements payload. Обычный текст остаётся React text node; HTML из чата не интерпретируется.

### `config`

`ConfigNormalizer` — недоверенная граница для `fieldData`. Он:

- подставляет defaults;
- ограничивает числа;
- исправляет перепутанные границы rotation;
- проверяет dropdown values;
- принимает только hex colors;
- принимает только HTTPS asset URLs;
- ограничивает размер списков ignored users и safe zones.

### `state`

`overlayReducer` управляет активными сообщениями. Стабильный React key равен `message.id`. Состояние `removed` означает отсутствие сообщения в массиве и DOM, поэтому tombstone в state не хранится.

При превышении `maxMessages` немедленно удаляется самое старое сообщение. Это ограничивает DOM и объём таймеров при долгой работе OBS.

### `lifecycle`

`MessageLifecycleService` владеет timeout handles и не рендерит UI. `sync` создаёт не более трёх таймеров на сообщение и отменяет их при moderation delete, limit eviction или unmount.

### `placement`

Placement Engine не зависит от DOM. На вход передаются:

- фактический размер wrapper после layout;
- размер сцены;
- collision rectangles активных сообщений;
- safe zones;
- edge padding, gap, attempts и rotation;
- подменяемый random source.

Для повёрнутого элемента рассчитывается axis-aligned bounding box. После конечного числа попыток fallback выбирает sampled candidate с минимальной суммой пересечений; пересечение safe zone штрафуется в десять раз сильнее.

При resize `ResizeObserver` очищает placements. Компоненты повторно измеряются, а алгоритм строит позиции для новых размеров Browser Source.

### `components`

Компоненты получают только доменные данные и нормализованную тему:

- `MessageLayer` — список;
- `MessageBubble` — измерение и CSS variables;
- `UserName` — имя и badges;
- `MessageContent` — text/emote fragments;
- `TwitchEmote` — безопасный `<img>`;
- `RoleCharacter` — отдельные character и decoration elements;
- `ErrorBoundary` — локальная ошибка рендера.

`useCallback` применяется только для measurement callback: изменение его identity повторно запускает `useLayoutEffect` у ещё не размещённых пузырей. `memo`, `useMemo` и глобальный Context для MVP не нужны.

## StreamElements build

Vite library mode создаёт один IIFE bundle. `react` и `react-dom` не объявлены external, поэтому включены в `widget.js`. CSS извлекается в один `widget.css`. Build target `chrome120` консервативнее Chromium 127, который OBS включил в Browser Source начиная с OBS 31.

Packaging script:

1. копирует HTML, Fields и инструкцию;
2. проверяет имена и отсутствие source maps;
3. проверяет отсутствие dev markers и внешнего React import;
4. валидирует JSON;
5. создаёт deterministic ZIP;
6. считает SHA-256.

## Безопасность

- нет OAuth tokens, backend или локального хранилища;
- нет `dangerouslySetInnerHTML` и `innerHTML`;
- Twitch media принимается только с известных HTTPS CDN hosts;
- custom assets принимаются только по HTTPS;
- события с неполной структурой игнорируются;
- пользовательский текст не участвует в CSS, URL или выполнении кода;
- production build не содержит dev fixture.

## Компромиссы MVP

- fallback может пересечь сообщение, если сцена физически заполнена;
- safe zones задаются JSON-массивом, так как Fields не предоставляют нативный редактор прямоугольников;
- UI для визуального редактирования не создаётся;
- полноценная интеграция подтверждается ручным тестом в StreamElements и OBS, а не jsdom.
