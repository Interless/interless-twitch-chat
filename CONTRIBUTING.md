# Contributing

## Workflow

1. Создайте feature branch от `main`: `feat/short-description`, `fix/short-description`, `docs/short-description`.
2. Устанавливайте зависимости только через `npm ci` или `npm install --save-exact`.
3. Не добавляйте secrets, OAuth tokens, финальные дизайнерские ассеты или чужой защищённый код.
4. Делайте небольшие коммиты по Conventional Commits.
5. Перед Pull Request выполните `npm run check`.

## Проверка поведения

Полная команда — `npm run check`. В ней есть DOM-проверки уже собранного редактора и копируемых вкладок, включая медиатеку, команды и масштаб. Для визуальных изменений и видео используй [ручной QA](docs/QA_CHECKLIST.md); успешный jsdom-тест не подтверждает воспроизведение в OBS.

Оформление меняется в превью и экспортируется снимком. Не возвращай в экспорт полный набор шрифтов или Base64 пользовательских анимаций: это увеличивает запрос сохранения Overlay. Выбранный файл, команда и общий масштаб должны оставаться доступными через нативные Fields. Идентификатор персонажа стабилен при переименовании команды.

## Definition of Done

- новые boundary values валидируются как `unknown`;
- нет `any`, `innerHTML` и `dangerouslySetInnerHTML`;
- side effects имеют cleanup;
- layout остаётся предсказуемым при разных размерах Browser Source;
- новая логика покрыта тестами;
- build output остаётся IIFE без external imports и dev fixtures;
- документация и QA checklist обновлены.

## Commit examples

```text
feat: add native Twitch emote fragments
fix: cancel lifecycle timers after moderation delete
test: cover bottom-up message order
docs: clarify StreamElements installation
```

## Pull Requests

PR должен быть небольшим, объяснять мотивацию и указывать фактически выполненные проверки. Изменение зависимостей должно содержать назначение, альтернативы и риски.

Проект распространяется по MIT License; contributions должны быть совместимы с этой лицензией.
