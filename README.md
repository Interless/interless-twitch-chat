# Interless Twitch Chat

Production-ready MVP виджета Twitch-чата для StreamElements Overlay и OBS Browser Source. Сообщения появляются в адаптивных облачках, получают оформление по роли и размещаются внутри сцены с учётом активных сообщений и safe zones.

Финальный дизайн в репозитории отсутствует намеренно: emoji и нейтральные цвета служат заглушками до передачи ассетов дизайнером.

## Возможности MVP

- React 19 + TypeScript strict без backend и секретов;
- роли `broadcaster > moderator > vip > subscriber > viewer`;
- нативные Twitch emotes и badges из документированного StreamElements payload;
- безопасный React text rendering без `innerHTML`;
- удаление сообщения и всех сообщений пользователя по модераторским событиям;
- независимый от React Placement Engine с внедряемым random source;
- ограниченные попытки размещения и fallback с минимальным пересечением;
- жизненный цикл `entering → visible → exiting → removed` с cleanup таймеров;
- настройка через StreamElements Custom Fields;
- IIFE bundle с React внутри, без CDN, внешних import и `type="module"`;
- ZIP установки и SHA-256 checksum.

## Требования

- Node.js `24.20.0` LTS (зафиксирован в `.nvmrc`);
- npm 11 или 12;
- актуальные StreamElements Overlay Editor и OBS Studio.

Версии зависимостей закреплены в `package-lock.json`. TypeScript 6 используется осознанно: актуальный `typescript-eslint` пока ограничивает peer dependency значением `<6.1`; TypeScript 7 нельзя подключать через `--force` без официальной совместимости.

## Быстрый старт

```bash
nvm use
npm ci
npm run dev
```

Dev server отправляет небольшие статические fixtures. Они находятся только в `src/dev`, удаляются tree shaking при production build и дополнительно проверяются упаковочным скриптом.

## Проверки

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Полная локальная проверка:

```bash
npm run check
```

## Production build

```bash
npm ci
npm run build
```

Результат:

```text
dist/
  streamelements/
    widget.html
    widget.css
    widget.js
    fields.json
    INSTALL.md
  interless-twitch-chat-v0.1.0.zip
  interless-twitch-chat-v0.1.0.zip.sha256
```

Установка описана в [`docs/INSTALL_STREAM_ELEMENTS.md`](docs/INSTALL_STREAM_ELEMENTS.md).

## Структура

```text
src/
  adapters/       # единственная граница StreamElements
  app/            # композиция приложения
  components/     # небольшие React-компоненты
  config/         # defaults и ConfigNormalizer
  dev/            # fixtures, исключаемые из production
  domain/         # типы, роли, fragments и assets
  hooks/          # DOM/React integration
  lifecycle/      # таймеры сообщений
  placement/      # чистая геометрия
  state/          # reducer
docs/             # архитектура, ассеты, установка и QA
streamelements/   # исходные HTML и Fields вкладки
tests/            # unit и component tests
```

Подробности: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Ограничения MVP

- StreamElements документирует `delete-message` и `delete-messages`, но не отдельный listener очистки всего чата. Reducer готов к `chat-cleared`, однако adapter не выдумывает внешний payload.
- Рейд — отдельное `raid-latest` событие. Надёжного постоянного признака «рейдер» у каждого последующего chat message нет.
- 7TV, BetterTTV и FrankerFaceZ не входят в MVP.
- Placement Engine не гарантирует отсутствие пересечения в полностью заполненной сцене; после конечного числа попыток выбирается кандидат с наименьшей площадью пересечения.

## Официальные документы

- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Vite library mode](https://vite.dev/guide/build)
- [Vite build options](https://vite.dev/config/build-options)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [StreamElements Widget Events](https://docs.streamelements.com/overlays/events)
- [StreamElements Widget Structure & Custom Fields](https://docs.streamelements.com/overlays/widget-structure)
- [OBS 31 Browser Source CEF update](https://obsproject.com/blog/obs-studio-31-0-release-notes)

## Лицензия

Проект распространяется по лицензии [MIT](LICENSE).
