import { strToU8, zipSync } from 'fflate';
import { decodePreset, encodePreset } from '../config/preset';
import { encodeProject } from './project';
import installGuide from '../../docs/QUICKSTART.md?raw';
import { normalizeCharacterPack, type CharacterPack } from '../domain/characterPack';
import { selectedFontCss } from './selectedFontCss';
import { createMediaLibrary } from '../domain/mediaLibrary';
import sourceFields from '../../streamelements/fields.json';
import { normalizeConfig } from '../config/configNormalizer';
const licenses = import.meta.glob('../assets/fonts/*OFL.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
});
interface ExportOptions {
  pack: CharacterPack | null;
  bundle: string;
  css: string;
  fields: Record<string, unknown>;
  settings: unknown;
}
export function createStreamElementsCode(
  options: ExportOptions,
): Record<'HTML' | 'CSS' | 'JS' | 'FIELDS', string> {
  const library = createMediaLibrary(options.pack);
  let bundle = options.bundle;
  bundle =
    'globalThis.__INTERLESS_CHARACTER_PACK__ = null;\n' +
    'globalThis.__INTERLESS_MEDIA_LIBRARY__ = ' +
    JSON.stringify(library.manifest).replaceAll('<', String.fromCharCode(92) + 'u003c') +
    ';\n' +
    bundle;
  const preset = encodePreset(options.settings);
  const settings = decodePreset(preset);
  bundle =
    'globalThis.__INTERLESS_WIDGET_LOCKED__ = true;\n' +
    'globalThis.__INTERLESS_WIDGET_PRESET__ = ' +
    JSON.stringify(preset).replaceAll('<', String.fromCharCode(92) + 'u003c') +
    ';\n' +
    bundle;
  return {
    HTML: '<div id="root"></div>',
    CSS: selectedFontCss(options.css, settings.fontFamily),
    JS: bundle,
    FIELDS: JSON.stringify(
      {
        chatScale: {
          ...sourceFields.chatScale,
          value: Math.round(normalizeConfig(settings).layout.scale * 100),
        },
        ...library.fields,
      },
      null,
      2,
    ),
  };
}

export function createStreamElementsArchive(options: ExportOptions): Uint8Array {
  const pack = options.pack === null ? null : normalizeCharacterPack(options.pack);
  const preset = encodePreset(options.settings);
  const code = createStreamElementsCode(options);
  const commands = Object.entries(pack?.characters ?? {}).map(
    ([id, item]) => '!' + (item.command ?? id) + ' — ' + item.name,
  );
  const pages: string[] = [];
  let page = '';
  for (const item of commands) {
    if (page.length + item.length > 380) {
      pages.push(page);
      page = '';
    }
    page += (page ? '; ' : '') + item;
  }
  if (page) pages.push(page);
  if (!commands.length) pages.push('Динозаврики ещё не загружены.');
  const files: Record<string, string> = {
    'widget.html': code.HTML,
    'widget.css': code.CSS,
    'widget.js': code.JS,
    'fields.json': code.FIELDS,
    'preset.json': preset,
    'project.json': encodeProject(options.settings, pack),
    'INSTALL.md': installGuide,
    'BOT-SETUP.txt':
      'Обновите Custom commands бота StreamElements; виджет не отправляет сообщения сам. Для первой команды можно настроить алиасы dino и ichat, если они свободны.\n' +
      pages
        .map(
          (text, i) =>
            '\nКоманда: !interless_chat' +
            (i ? String(i + 1) : '') +
            '\nОтвет: ' +
            text +
            (i + 1 < pages.length ? ' Ещё: !interless_chat' + String(i + 2) : ''),
        )
        .join('\n'),
    'FONT-LICENSE.txt': Object.entries(licenses)
      .map(([path, text]) => path + '\n' + text)
      .join('\n\n'),
    'DINOSAURS.json': JSON.stringify(
      Object.fromEntries(
        Object.entries(pack?.characters ?? {}).map(([id, item]) => [
          id,
          { name: item.name, width: item.width, height: item.height, bounds: item.bounds },
        ]),
      ),
      null,
      2,
    ),
  };
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])),
    { level: 6, mtime: new Date(1980, 0, 2) },
  );
}
