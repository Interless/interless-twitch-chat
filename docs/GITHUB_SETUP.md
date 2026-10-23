# Публикация на GitHub

Репозиторий: [Interless/interless-twitch-chat](https://github.com/Interless/interless-twitch-chat). Исходники находятся в Git, готовые ZIP — в GitHub Releases. `dist/` не коммитится.

## Подготовка

1. Обнови `package.json` и `package-lock.json` одной версией.
2. Обнови CHANGELOG и заметки `docs/releases/v<версия>.md`.
3. Выполни `npm ci` и `npm run check`.
4. Закоммить исходники и документацию, отправь ветку и перенеси изменения в `main` обычным fast-forward/merge через принятый workflow репозитория.

Для текущей ветки, если изменения уже проверены и разрешён прямой push в main:

```bash
git fetch origin
git merge --ff-only origin/main
git push origin HEAD:main
```

Если ветка и удалённый main разошлись, сначала разреши расхождения обычным merge/PR. Force push для выпуска не требуется.

## Релиз по тегу

После успешной публикации соответствующего коммита:

```bash
git tag -a v0.21.1 -m "Interless Chat v0.21.1"
git push origin v0.21.1
```

Workflow `Release` проверяет соответствие тега версии пакета, запускает полную проверку, создаёт GitHub Release с заметками из `docs/releases/v0.21.1.md` и прикрепляет один установочный ZIP. В репозитории должны быть разрешены Actions и выдача `contents: write` этому release-job. Собственный PAT для workflow не требуется: используется стандартный `GITHUB_TOKEN`.

Проверь результат в разделе Actions, затем в Releases. Ссылки «Скачать» в README ведут на release page, а не на стандартный GitHub Source code ZIP: в исходном ZIP нет собранного локального редактора.

## CI

CI на push/PR в main проверяет форматирование, lint, TypeScript, тесты, сборку и готовое превью. Установочный пакет сохраняется как artifact run. CI и выпуск не подтверждают ручные сценарии OBS: они отмечаются в [QA_CHECKLIST.md](QA_CHECKLIST.md).

## Описание репозитория

Рекомендуемое поле About:

> Настраиваемый Twitch-чат с костяными рамками, персональными динозаврами, локальным превью и медиатекой StreamElements. Для OBS, без собственного сервера.

Темы: `twitch`, `streamelements`, `obs`, `chat-overlay`, `dinosaurs`, `typescript`, `react`, `pixel-art`.
