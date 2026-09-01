# Установка в StreamElements и OBS

## Сборка

```bash
npm ci
npm run build
```

Используйте файлы из `dist/streamelements` или распакуйте `dist/interless-twitch-chat-v0.1.0.zip`.

Проверка архива:

```bash
sha256sum -c dist/interless-twitch-chat-v0.1.0.zip.sha256
```

В PowerShell:

```powershell
Get-FileHash .\dist\interless-twitch-chat-v0.1.0.zip -Algorithm SHA256
```

## StreamElements

1. Создайте Overlay с разрешением вашей сцены.
2. Добавьте `Static / Custom → Custom Widget`.
3. Нажмите `Open Editor`.
4. Полностью замените содержимое вкладок:
   - `HTML` ← `widget.html`;
   - `CSS` ← `widget.css`;
   - `JS` ← `widget.js`;
   - `FIELDS` ← `fields.json`.
5. Сохраните код и настройки Overlay.
6. В Custom Fields настройте General, Placement, Animation и role themes.
7. Используйте `Emulate`/тестовые события и отдельный Twitch-канал для проверки реальных сообщений.

`widget.js` — обычный IIFE. Не добавляйте `<script type="module">`, CDN React или содержимое `index.html`.

Safe zones задаются JSON-массивом в пикселях Overlay:

```json
[
  { "x": 0, "y": 0, "width": 500, "height": 180 },
  { "x": 1400, "y": 800, "width": 520, "height": 280 }
]
```

## OBS

1. Скопируйте Overlay URL из StreamElements.
2. В OBS добавьте `Browser Source`.
3. Вставьте URL.
4. Установите Width/Height равными разрешению Overlay, например `1920 × 1080`.
5. Включите refresh при смене сцены только если это соответствует вашему workflow: refresh очищает текущие сообщения.
6. Проверяйте виджет без запуска публичной трансляции через Preview/Studio Mode.

## Обновление версии

После новой сборки повторно замените четыре вкладки. Fields заменяйте осторожно: перед этим запишите нестандартные значения и выбранные ассеты.

## Диагностика

- Нет сообщений: убедитесь, что Custom Widget находится в Twitch Overlay и Overlay URL открыт в OBS.
- Есть HTML, но нет React UI: повторно вставьте весь `widget.js` и сохраните editor.
- Ассет не отображается: загрузите его через `image-input`; HTTP URL намеренно блокируются.
- Сообщения выходят из удобной зоны: увеличьте edge padding или добавьте safe zone.
- Много fallback-пересечений: уменьшите max messages/bubble width либо увеличьте область Browser Source.
