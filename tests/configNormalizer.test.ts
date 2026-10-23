import { afterEach, describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/config/configNormalizer';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import fields from '../streamelements/fields.json';
import { installCharacterPack } from '../src/domain/characterRegistry';
import { TEST_CHARACTER_PACK } from './characterFixtures';
afterEach(() => installCharacterPack(null));

describe('normalizeConfig', () => {
  it('keeps installation field defaults in sync with the included theme', () => {
    const installed = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [
        key,
        'value' in field ? field.value : undefined,
      ]),
    );
    expect(normalizeConfig(installed)).toEqual(DEFAULT_CONFIG);
  });

  it('validates character size, placement and header colors at the settings boundary', () => {
    const config = normalizeConfig({
      characterSize: 999,
      characterSide: 'outside',
      viewerThemeHeaderColor: 'red; position: fixed',
      broadcasterThemeHeaderColor: '#abcdef',
    });
    expect(config.layout.characterSize).toBe(280);
    expect(config.layout.characterSide).toBe('alternating');
    expect(config.roleThemes.viewer.headerColor).toBe(DEFAULT_CONFIG.roleThemes.viewer.headerColor);
    expect(config.roleThemes.broadcaster.headerColor).toBe('#abcdef');
  });

  it('returns safe defaults for an invalid boundary value', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
  });
  it('normalizes the overall scale and bounds imported values', () => {
    expect(normalizeConfig({ chatScale: 150 }).layout.scale).toBe(1.5);
    expect(normalizeConfig({ chatScale: '50' }).layout.scale).toBe(0.5);
    expect(normalizeConfig({ chatScale: -10 }).layout.scale).toBe(0.25);
    expect(normalizeConfig({ chatScale: 500 }).layout.scale).toBe(2);
    expect(normalizeConfig({ chatScale: 'invalid' }).layout.scale).toBe(1);
  });

  it('clamps layout values and rejects unknown dropdown values', () => {
    const config = normalizeConfig({
      displayTimeSeconds: 999,
      maxMessages: -2,
      minWidth: 500,
      maxWidth: 120,
      fontSize: '999',
      chatAlignment: 'diagonal',
      horizontalOffset: 9999,
      bottomOffset: -4,
      enterAnimation: 'explode',
    });

    expect(config.general.displayTimeMs).toBe(120_000);
    expect(config.general.maxMessages).toBe(1);
    expect(config.general.maxWidth).toBe(500);
    expect(config.general.fontSize).toBe(72);
    expect(config.layout.alignment).toBe(DEFAULT_CONFIG.layout.alignment);
    expect(config.layout.horizontalOffset).toBe(600);
    expect(config.layout.bottomOffset).toBe(0);
    expect(config.animation.enter).toBe(DEFAULT_CONFIG.animation.enter);
  });

  it('normalizes ignored users, layout, colors, and HTTPS assets', () => {
    const config = normalizeConfig({
      ignoredUsers: 'BadUser, second; THIRD',
      chatAlignment: 'right',
      messageGap: 24,
      vipThemeBubbleColor: 'not-a-color',
      vipThemeCharacter: 'http://example.com/unsafe.png',
      vipThemeDecoration: 'https://example.com/bone.webp',
    });

    expect(config.general.ignoredUsers).toEqual(['baduser', 'second', 'third']);
    expect(config.layout.alignment).toBe('right');
    expect(config.layout.messageGap).toBe(24);
    expect(config.roleThemes.vip.bubbleColor).toBe(DEFAULT_CONFIG.roleThemes.vip.bubbleColor);
    expect(config.roleThemes.vip.assets.characterUrl).toBeNull();
    expect(config.roleThemes.vip.assets.decorationUrl).toBe('https://example.com/bone.webp');
  });
});

describe('dinosaur catalog', () => {
  it('validates catalog URLs and limits assignments to known dinosaurs', () => {
    const config = normalizeConfig({
      dinosaurCatalog: JSON.stringify({
        dance: { name: 'Рекс', url: 'https://example.com/dance.webp' },
        unsafe: { url: 'javascript:alert(1)' },
        'bad id': { url: '' },
      }),
      userDinosaurs: '{"Viewer":"dance","Other":"unknown","Third":"skel"}',
    });
    expect(config.dinosaurs).toEqual({
      ...DEFAULT_CONFIG.dinosaurs,
      dance: { name: 'Рекс', characterUrl: 'https://example.com/dance.webp' },
    });
    expect(config.userDinosaurs).toEqual({ viewer: 'dance' });
    expect(normalizeConfig({ dinosaurCatalog: '{bad' }).dinosaurs).toEqual(
      DEFAULT_CONFIG.dinosaurs,
    );
  });
});

describe('chat anchoring migration', () => {
  it('maps the old screen-wide alternating alignment to the compact left anchor', () => {
    expect(normalizeConfig({ chatAlignment: 'alternating' }).layout.alignment).toBe('left');
    expect(normalizeConfig({ chatAlignment: 'left' }).layout.alignment).toBe('left');
    expect(normalizeConfig({ chatAlignment: 'right' }).layout.alignment).toBe('right');
  });
});

describe('font migration', () => {
  it('replaces retired font settings while preserving explicit choices for other fonts', () => {
    const migrated = normalizeConfig({
      fontFamily: 'Interless Pixel',
      fontSize: 30,
      lineHeight: 1,
    });
    expect(migrated.general).toMatchObject({
      fontFamily: 'Press Start 2P',
      fontSize: 16,
      lineHeight: 1.5,
    });
    expect(
      normalizeConfig({ fontFamily: 'My Font', fontSize: 22, lineHeight: 1.2 }).general,
    ).toMatchObject({ fontFamily: 'My Font', fontSize: 22, lineHeight: 1.2 });
  });
});

describe('surface appearance', () => {
  it('clamps decoration settings and honors each icon toggle', () => {
    expect(
      normalizeConfig({
        decorationDensity: -2,
        decorationChance: 400,
        decorationFrequency: 150,
        decorationOpacity: 99,
        decorationbone: false,
      }).decorations,
    ).toEqual({
      ...DEFAULT_CONFIG.decorations,
      density: 0,
      chance: 100,
      frequency: 100,
      opacity: 0.7,
      icons: DEFAULT_CONFIG.decorations.icons.filter((kind) => kind !== 'bone'),
    });
    expect(normalizeConfig({ decorationsEnabled: 'false' }).decorations.enabled).toBe(false);
  });
  it('accepts only known RGB colors and rejects CSS or SVG injection in palette overrides', () => {
    const config = normalizeConfig({
      customColors: {
        textColor: '#12AbEF',
        boneColor: '#00ff80',
        headerColor: '#aabbcc80',
        badgeColor: 'red; background: url(https://example.com)',
        frameColor: '"><script>alert(1)</script>',
        unknown: '#112233',
      },
    });
    expect(config.appearance.customColors).toEqual({
      textColor: '#12AbEF',
      boneColor: '#00ff80',
    });
    expect(normalizeConfig({ customColors: null })).toEqual(DEFAULT_CONFIG);
    expect(normalizeConfig({ customColors: { textColor: 'red' } })).toEqual(DEFAULT_CONFIG);
  });

  it('clamps opacity percentages and rejects unknown palette settings', () => {
    expect(
      normalizeConfig({ colorScheme: 'invalid', bubbleOpacity: 150, headerOpacity: -20 })
        .appearance,
    ).toEqual({ colorScheme: 'roles', bubbleOpacity: 1, headerOpacity: 0 });
    expect(
      normalizeConfig({ colorScheme: 'dark', bubbleOpacity: '65', headerOpacity: 85 }).appearance,
    ).toEqual({ colorScheme: 'dark', bubbleOpacity: 0.65, headerOpacity: 0.85 });
    expect(normalizeConfig({ bubbleOpacity: 'invalid' }).appearance.bubbleOpacity).toBe(1);
  });
});

describe('upload-only catalog', () => {
  it('starts empty and ignores obsolete names without media in an old preset', () => {
    expect(DEFAULT_CONFIG.dinosaurs).toEqual({});
    expect(
      normalizeConfig({ dinosaurCatalog: '{"skel":{"url":""},"dance":{"url":""}}' }).dinosaurs,
    ).toEqual({});
  });
  it('keeps uploaded media when catalog entries only supply a name', () => {
    installCharacterPack(TEST_CHARACTER_PACK);
    const config = normalizeConfig({ dinosaurCatalog: '{"alpha":{"name":"Мой","url":""}}' });
    expect(config.dinosaurs.alpha).toEqual({
      name: 'Мой',
      characterUrl: TEST_CHARACTER_PACK.characters.alpha?.url,
    });
    expect(config.dinosaurs.beta?.characterUrl).toBe(TEST_CHARACTER_PACK.characters.beta?.url);
  });
});
