import { afterEach, describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { characterIdFromFilename, normalizeCharacterPack } from '../src/domain/characterPack';
import {
  CHARACTER_URLS,
  CHARACTER_CATALOG,
  installCharacterPack,
  getCharacterPack,
  updateCharacterCommand,
} from '../src/domain/characterRegistry';
import { normalizeConfig } from '../src/config/configNormalizer';
import { createStreamElementsArchive, createStreamElementsCode } from '../src/preview/exportPack';
import { decodePreset, encodePreset } from '../src/config/preset';
import { importCharacterFolder } from '../src/preview/folderImport';
import { encodeProject, decodeProject } from '../src/preview/project';
import { characterIdForCommand, dinosaurHelp } from '../src/domain/chatCommands';
import { INITIAL_OVERLAY_STATE, overlayReducer } from '../src/state/overlayReducer';
import { createChatMessage } from './fixtures';
import { createMediaLibrary, resolveMediaLibraryPack } from '../src/domain/mediaLibrary';
import { isVideoUrl } from '../src/domain/media';
const media = {
  name: 'Новый',
  url: 'data:video/webm;base64,GkXfow==',
  width: 320,
  height: 320,
  bounds: [0, 0, 320, 320],
};
afterEach(() => {
  installCharacterPack(null);
  delete (globalThis as { __INTERLESS_WIDGET_PRESET__?: string }).__INTERLESS_WIDGET_PRESET__;
  delete (globalThis as { __INTERLESS_WIDGET_LOCKED__?: boolean }).__INTERLESS_WIDGET_LOCKED__;
});
describe('portable character folders', () => {
  it('prepares the four StreamElements tabs without injecting font license text', () => {
    const code = createStreamElementsCode({
      pack: { version: 1, characters: { newdino: media } },
      bundle: '/* runtime */',
      css: '.chat{}',
      fields: { fontSize: { value: 10 }, presetJson: { value: 'old' } },
      settings: { fontSize: 24 },
    });
    expect(Object.keys(code)).toEqual(['HTML', 'CSS', 'JS', 'FIELDS']);
    expect(code.HTML).toBe('<div id="root"></div>');
    expect(code.CSS).toBe('.chat{}');
    for (const value of Object.values(code))
      expect(value).not.toMatch(/OPEN FONT LICENSE|Bundled font licenses/u);
    expect(code.JS).not.toContain(media.url);
    expect(code.JS).toContain('/* runtime */');
    expect(JSON.parse(code.FIELDS)).toMatchObject({
      dinoMedia_newdino: { type: 'video-input', value: '', label: 'Файл: Новый' },
      dinoCommand_newdino: { type: 'text', value: '!newdino' },
    });
    expect(code.JS).toContain('__INTERLESS_MEDIA_LIBRARY__');
    expect(code.JS).toContain('__INTERLESS_WIDGET_LOCKED__ = true');
  });
  it('creates commands from names and rejects retired commands', () => {
    expect(characterIdFromFilename('trex.webm')).toBe('trex');
    expect(characterIdFromFilename('Трицератопс.webm')).toBe('tritseratops');
    expect(characterIdFromFilename('7.gif')).toBe('dino7');
    for (const name of ['velo', 'rex', 'dino'])
      expect(() => characterIdFromFilename(name + '.webm')).toThrow();
    expect(characterIdForCommand('!velo')).toBeUndefined();
    expect(characterIdForCommand('!rex')).toBeUndefined();
    expect(dinosaurHelp()).toBe('Динозаврики ещё не загружены.');
  });
  it('atomically installs replacements and new characters', () => {
    const before = CHARACTER_URLS.trex;
    installCharacterPack({ version: 1, characters: { trex: media, newdino: media } });
    expect(normalizeConfig({}).dinosaurs.trex?.characterUrl).toBe(media.url);
    expect(CHARACTER_CATALOG.newdino?.name).toBe('Новый');
    expect(() =>
      installCharacterPack({ version: 1, characters: { bad: { ...media, url: 'blob:local' } } }),
    ).toThrow();
    expect(CHARACTER_URLS.trex).toBe(media.url);
    installCharacterPack(null);
    expect(CHARACTER_URLS.trex).toBe(before);
    expect(CHARACTER_CATALOG.newdino).toBeUndefined();
    expect(CHARACTER_URLS).toEqual({});
    expect(normalizeConfig({}).dinosaurs).toEqual({});
  });
  it('replaces the previous set instead of retaining old characters', () => {
    installCharacterPack({ version: 1, characters: { old: media } });
    installCharacterPack({ version: 1, characters: { newdino: media } });
    expect(Object.keys(CHARACTER_CATALOG)).toEqual(['newdino']);
    expect(dinosaurHelp()).toContain('!newdino');
    expect(dinosaurHelp()).not.toContain('!old');
  });
  it('exports an empty pack without any default characters or help commands', () => {
    const zip = unzipSync(
      createStreamElementsArchive({
        pack: null,
        bundle: '/* widget */',
        css: '',
        fields: {},
        settings: {},
      }),
    );
    expect(strFromU8(zip['widget.js'] ?? new Uint8Array())).toContain(
      '__INTERLESS_CHARACTER_PACK__ = null;',
    );
    expect(strFromU8(zip['DINOSAURS.json'] ?? new Uint8Array())).toBe('{}');
    expect(strFromU8(zip['BOT-SETUP.txt'] ?? new Uint8Array())).toContain(
      'Динозаврики ещё не загружены',
    );
  });
  it('rejects unsafe references and invalid bounds', () => {
    for (const url of [
      'blob:x',
      'file:///tmp/file',
      'http://example.com/file',
      'javascript:alert(1)',
      'https://user:password@example.com/file',
      'data:text/html;base64,AA==',
    ])
      expect(() =>
        normalizeCharacterPack({ version: 1, characters: { trex: { ...media, url } } }),
      ).toThrow();
    expect(() =>
      normalizeCharacterPack({
        version: 1,
        characters: { trex: { ...media, bounds: [0, 0, 900, 320] } },
      }),
    ).toThrow();
  });
  it('reads source bytes into portable media and rejects duplicate filenames', async () => {
    const measure = () => Promise.resolve({ width: 320, height: 320 });
    const pack = await importCharacterFolder(
      [new File(['file bytes'], 'trex.webm'), new File(['readme'], 'notes.txt')],
      measure,
    );
    expect(pack.characters.trex?.url).toMatch(/^data:video\/webm;base64,/u);
    await expect(
      importCharacterFolder([new File(['a'], 'trex.webm'), new File(['b'], 'trex.gif')], measure),
    ).rejects.toThrow('Два файла');
  });
  it('exports media and settings without local paths and preserves palette values', () => {
    const zip = unzipSync(
      createStreamElementsArchive({
        pack: normalizeCharacterPack({ version: 1, characters: { newdino: media } }),
        bundle: '/* widget */',
        css: '.chat{}',
        fields: { presetJson: { value: '' }, fontSize: { type: 'slider', value: 10 } },
        settings: { fontSize: 24, customColors: { textColor: '#112233' } },
      }),
    );
    const read = (name: string) => strFromU8(zip[name] ?? new Uint8Array());
    expect(read('widget.js')).not.toContain(media.url);
    expect(read('widget.js')).toContain('__INTERLESS_CHARACTER_PACK__');
    expect(read('widget.js')).not.toContain('blob:');
    expect(decodePreset(read('preset.json'))).toMatchObject({
      fontSize: 24,
      customColors: { textColor: '#112233' },
    });
    expect(read('FONT-LICENSE.txt')).toContain('OPEN FONT LICENSE');
    expect(read('BOT-SETUP.txt')).toContain('!newdino');
    expect(JSON.parse(read('fields.json'))).toHaveProperty('dinoMedia_newdino.type', 'video-input');
    expect(read('widget.js')).toContain('__INTERLESS_WIDGET_PRESET__');
    expect(decodeProject(read('project.json')).pack?.characters.newdino?.url).toBe(media.url);
    expect(read('INSTALL.md')).toContain('FIELDS');
  });
  it('round-trips complete projects and rejects invalid media before opening', () => {
    const project = encodeProject({ fontSize: 24 }, { version: 1, characters: { newdino: media } });
    expect(decodePreset(decodeProject(project).preset)).toEqual({ fontSize: 24 });
    expect(decodeProject(encodeProject({}, null)).pack).toBeNull();
    expect(() => decodeProject(project.replace(media.url, 'blob:invalid'))).toThrow();
    expect(() => decodeProject(encodePreset({}))).toThrow();
  });
  it('renames commands without changing character IDs, media or saved assignments', () => {
    installCharacterPack({ version: 1, characters: { trex: media, para: media } });
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({}),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'choose', text: '!trex' }),
    });
    updateCharacterCommand('trex', ' !Раптор ');
    expect(characterIdForCommand(' !РАПТОР ')).toBe('trex');
    expect(characterIdForCommand('!trex')).toBeUndefined();
    expect(CHARACTER_URLS.trex).toBe(media.url);
    expect(dinosaurHelp()).toContain('!раптор — Новый');
    expect(dinosaurHelp()).not.toContain('!trex');
    state = overlayReducer(state, { type: 'config-loaded', config: normalizeConfig({}) });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'after' }),
    });
    expect(state.messages[0]?.characterId).toBe('trex');
    expect(state.userCharacters['user-1']).toBe('trex');
    const project = decodeProject(encodeProject({}, getCharacterPack()));
    expect(project.pack?.characters.trex?.command).toBe('раптор');
    const fields = createMediaLibrary(project.pack).fields;
    expect(fields).toHaveProperty('dinoMedia_trex');
    expect(fields).toMatchObject({ dinoCommand_trex: { value: '!раптор' } });
    for (const bad of [
      '',
      '!dino',
      '!ichat',
      '!interless_chat',
      'two words',
      '1abc',
      '!!abc',
      '!PARA',
      'a'.repeat(33),
    ])
      expect(() => updateCharacterCommand('trex', bad)).toThrow();
    expect(CHARACTER_CATALOG.trex?.command).toBe('раптор');
  });
  it('accepts native command edits and rolls invalid or colliding edits back safely', () => {
    const remote = 'https://cdn.streamelements.com/uploads/test';
    const library = createMediaLibrary({
      version: 1,
      characters: {
        alpha: { ...media, url: remote },
        beta: { ...media, url: remote },
        gamma: { ...media, url: remote },
      },
    });
    const renamed = resolveMediaLibraryPack(library.manifest, { dinoCommand_alpha: '!Tyrex' });
    expect(renamed?.characters.alpha).toMatchObject({ url: remote, command: 'tyrex' });
    installCharacterPack(renamed);
    expect(characterIdForCommand('!tyrex')).toBe('alpha');
    expect(characterIdForCommand('!alpha')).toBeUndefined();
    for (const edits of [
      { dinoCommand_alpha: '!dino' },
      { dinoCommand_alpha: '!beta' },
      { dinoCommand_alpha: '!beta', dinoCommand_beta: '!gamma' },
      { dinoCommand_alpha: '!same', dinoCommand_beta: '!same' },
    ]) {
      const pack = resolveMediaLibraryPack(library.manifest, edits);
      expect(Object.values(pack?.characters ?? {}).map((item) => item.command)).toEqual([
        'alpha',
        'beta',
        'gamma',
      ]);
    }
    const swapped = resolveMediaLibraryPack(library.manifest, {
      dinoCommand_alpha: '!beta',
      dinoCommand_beta: '!alpha',
    });
    expect(swapped?.characters.alpha?.command).toBe('beta');
    expect(swapped?.characters.beta?.command).toBe('alpha');
  });
  it('exports metadata only regardless of local animation size', () => {
    const exportWith = (url: string) =>
      createStreamElementsCode({
        pack: { version: 1, characters: { trex: { ...media, url } } },
        bundle: '/* runtime */',
        css: '',
        fields: {},
        settings: {},
      });
    const small = exportWith(media.url);
    const large = exportWith('data:video/webm;base64,' + 'A'.repeat(4 * 1024 * 1024));
    expect(large).toEqual(small);
    expect(large.JS.length).toBeLessThan(1000);
  });
  it('resolves native media selection, explicit clearing and extensionless video URLs', () => {
    const remote = 'https://cdn.streamelements.com/uploads/opaque-id';
    const library = createMediaLibrary({
      version: 1,
      characters: {
        trex: media,
        para: { ...media, url: 'data:image/gif;base64,R0lGODlhAQAB' },
      },
    });
    expect(library.fields).toMatchObject({ dinoMedia_para: { type: 'image-input' } });
    expect(resolveMediaLibraryPack(library.manifest, {})).toBeNull();
    const pack = resolveMediaLibraryPack(library.manifest, {
      dinoMedia_trex: remote,
      dinoMedia_para: 'data:text/html;base64,AA==',
    });
    expect(Object.keys(pack?.characters ?? {})).toEqual(['trex']);
    expect(pack?.characters.trex).toMatchObject({ ...media, url: remote, mediaType: 'video' });
    expect(isVideoUrl(remote, pack?.characters.trex?.mediaType)).toBe(true);
    const project = encodeProject({}, pack);
    expect(decodeProject(project).pack?.characters.trex?.url).toBe(remote);
    const remoteLibrary = createMediaLibrary(pack);
    expect(remoteLibrary.fields).toMatchObject({ dinoMedia_trex: { value: remote } });
    expect(resolveMediaLibraryPack(remoteLibrary.manifest, {})?.characters.trex?.url).toBe(remote);
    expect(resolveMediaLibraryPack(remoteLibrary.manifest, { dinoMedia_trex: '' })).toBeNull();
    expect(
      resolveMediaLibraryPack(remoteLibrary.manifest, { dinoMedia_trex: 'blob:bad' }),
    ).toBeNull();
  });
  it('applies the complete exported snapshot over stale settings and supports manual mode', () => {
    const settings = {
      fontSize: 24,
      bubbleOpacity: 37,
      headerOpacity: 64,
      idleFrequency: 44,
      decorationDensity: 82,
      decorationOpacity: 70,
      decorationbeer: false,
      customColors: { badgeColor: '#abcdef', textColor: '#112233' },
    };
    (globalThis as { __INTERLESS_WIDGET_PRESET__?: string }).__INTERLESS_WIDGET_PRESET__ =
      encodePreset(settings);
    const stale = { fontSize: 10, presetJson: encodePreset({ fontSize: 12 }) };
    const config = normalizeConfig(stale);
    expect(config.general.fontSize).toBe(24);
    expect(config.appearance.bubbleOpacity).toBe(0.37);
    expect(config.appearance.headerOpacity).toBe(0.64);
    expect(config.appearance.customColors).toEqual(settings.customColors);
    expect(config.decorations.opacity).toBe(0.7);
    expect(config.decorations.density).toBe(82);
    expect(config.decorations.icons).not.toContain('beer');
    expect(
      normalizeConfig({
        settingsSource: 'fields',
        customColors: JSON.stringify({ textColor: '#aabbcc' }),
      }).appearance.customColors?.textColor,
    ).toBe('#aabbcc');
    expect(
      normalizeConfig({ ...stale, settingsSource: 'fields', presetJson: '' }).general.fontSize,
    ).toBe(10);
    expect(normalizeConfig({ ...stale, settingsSource: 'fields' }).general.fontSize).toBe(12);
    (globalThis as { __INTERLESS_WIDGET_LOCKED__?: boolean }).__INTERLESS_WIDGET_LOCKED__ = true;
    expect(normalizeConfig({ ...stale, settingsSource: 'fields' }).general.fontSize).toBe(24);
  });
  it('keeps the overall scale live in StreamElements while preserving the exported theme', () => {
    (globalThis as { __INTERLESS_WIDGET_PRESET__?: string }).__INTERLESS_WIDGET_PRESET__ =
      encodePreset({ chatScale: 75, fontSize: 24 });
    (globalThis as { __INTERLESS_WIDGET_LOCKED__?: boolean }).__INTERLESS_WIDGET_LOCKED__ = true;
    expect(normalizeConfig({}).layout.scale).toBe(0.75);
    const live = normalizeConfig({ chatScale: 150, fontSize: 10 });
    expect(live.layout.scale).toBe(1.5);
    expect(live.general.fontSize).toBe(24);
    expect(normalizeConfig({ chatScale: 'bad' }).layout.scale).toBe(0.75);
    expect(normalizeConfig({ chatScale: '' }).layout.scale).toBe(0.75);
  });
  it('applies imported presets and ignores invalid JSON', () => {
    const code = encodePreset({ fontSize: 24 });
    expect(normalizeConfig({ fontSize: 10, presetJson: code }).general.fontSize).toBe(24);
    expect(() => decodePreset('{broken')).toThrow('JSON');
  });
  it('updates already displayed preview characters consistently per author', () => {
    installCharacterPack({ version: 1, characters: { trex: media, para: media } });
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({}),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'one' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'two' }),
    });
    const before = state.messages.map((a) => ({
      message: a.message,
      side: a.side,
      lifecycle: a.lifecycle,
    }));
    state = overlayReducer(state, {
      type: 'preview-characters-selected',
      characterIds: ['trex', 'para'],
    });
    expect(state.messages.map((a) => a.characterId)).toEqual(['trex', 'trex']);
    expect(
      state.messages.map((a) => ({ message: a.message, side: a.side, lifecycle: a.lifecycle })),
    ).toEqual(before);
  });
});
