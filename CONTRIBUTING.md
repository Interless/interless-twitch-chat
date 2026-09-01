# Contributing

## Workflow

1. Создайте feature branch от `main`: `feat/short-description`, `fix/short-description`, `docs/short-description`.
2. Устанавливайте зависимости только через `npm ci` или `npm install --save-exact`.
3. Не добавляйте secrets, OAuth tokens, финальные дизайнерские ассеты или чужой защищённый код.
4. Делайте небольшие коммиты по Conventional Commits.
5. Перед Pull Request выполните `npm run check`.

## Definition of Done

- новые boundary values валидируются как `unknown`;
- нет `any`, `innerHTML` и `dangerouslySetInnerHTML`;
- side effects имеют cleanup;
- геометрия остаётся независимой от DOM;
- новая логика покрыта тестами;
- build output остаётся IIFE без external imports и dev fixtures;
- документация и QA checklist обновлены.

## Commit examples

```text
feat: add native Twitch emote fragments
fix: cancel lifecycle timers after moderation delete
test: cover placement fallback
docs: clarify StreamElements installation
```

## Pull Requests

PR должен быть небольшим, объяснять мотивацию и указывать фактически выполненные проверки. Изменение зависимостей должно содержать назначение, альтернативы и риски.

Лицензия проекта пока не выбрана; внешние contributions не следует принимать до решения владельца репозитория о модели лицензирования.
