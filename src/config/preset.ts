import fields from '../../streamelements/fields.json';
const allowed = new Set(
  Object.keys(fields).filter(
    (key) =>
      !['settingsSource', 'presetJson', 'widgetName', 'widgetAuthor', 'widgetDuration'].includes(
        key,
      ),
  ),
);
allowed.add('customColors');
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function portable(value: unknown): Record<string, unknown> {
  if (!record(value)) throw new Error('Некорректные настройки.');
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowed.has(key)));
}
export function encodePreset(settings: unknown): string {
  const code = JSON.stringify({
    format: 'interless-chat-preset',
    version: 1,
    settings: portable(settings),
  });
  if (code.length > 200000) throw new Error('Пресет слишком большой.');
  return code;
}
export function decodePreset(code: string): Record<string, unknown> {
  if (code.length > 200000) throw new Error('Пресет слишком большой.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(code);
  } catch {
    throw new Error('Не удалось прочитать JSON пресета.');
  }
  if (!record(parsed) || parsed.format !== 'interless-chat-preset' || parsed.version !== 1)
    throw new Error('Неподдерживаемый пресет.');
  return portable(parsed.settings);
}
export function applyPresetFields(value: unknown): Record<string, unknown> {
  let base = record(value) ? value : {};
  const exported = (globalThis as { __INTERLESS_WIDGET_PRESET__?: unknown })
    .__INTERLESS_WIDGET_PRESET__;
  if (typeof exported === 'string') {
    try {
      const settings = decodePreset(exported);
      const locked =
        (globalThis as { __INTERLESS_WIDGET_LOCKED__?: unknown }).__INTERLESS_WIDGET_LOCKED__ ===
        true;
      if (locked || base.settingsSource !== 'fields') {
        const liveScale = base.chatScale;
        const validLiveScale =
          (typeof liveScale === 'number' ||
            (typeof liveScale === 'string' && liveScale.trim() !== '')) &&
          Number.isFinite(Number(liveScale));
        return {
          ...base,
          ...settings,
          ...(locked && validLiveScale ? { chatScale: liveScale } : {}),
        };
      }
      base = { ...settings, ...base };
    } catch {
      // A malformed embedded snapshot must not prevent normal widget loading.
    }
  }
  try {
    return typeof base.presetJson === 'string' && base.presetJson.trim()
      ? { ...base, ...decodePreset(base.presetJson) }
      : base;
  } catch {
    return base;
  }
}
