import { describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/config/configNormalizer';
import { DEFAULT_CONFIG } from '../src/config/defaults';

describe('normalizeConfig', () => {
  it('returns safe defaults for an invalid boundary value', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it('clamps numbers, orders rotation, and rejects unknown dropdown values', () => {
    const config = normalizeConfig({
      displayTimeSeconds: 999,
      maxMessages: -2,
      minWidth: 500,
      maxWidth: 120,
      fontSize: '999',
      rotationMin: 8,
      rotationMax: -4,
      enterAnimation: 'explode',
    });

    expect(config.general.displayTimeMs).toBe(120_000);
    expect(config.general.maxMessages).toBe(1);
    expect(config.general.maxWidth).toBe(500);
    expect(config.general.fontSize).toBe(72);
    expect(config.placement.rotationMin).toBe(-4);
    expect(config.placement.rotationMax).toBe(8);
    expect(config.animation.enter).toBe(DEFAULT_CONFIG.animation.enter);
  });

  it('normalizes ignored users, safe zones, colors, and HTTPS assets', () => {
    const config = normalizeConfig({
      ignoredUsers: 'BadUser, second; THIRD',
      safeZones: '[{"x":10,"y":20,"width":300,"height":200}]',
      vipThemeBubbleColor: 'not-a-color',
      vipThemeCharacter: 'http://example.com/unsafe.png',
      vipThemeDecoration: 'https://example.com/bone.webp',
    });

    expect(config.general.ignoredUsers).toEqual(['baduser', 'second', 'third']);
    expect(config.placement.safeZones).toEqual([{ x: 10, y: 20, width: 300, height: 200 }]);
    expect(config.roleThemes.vip.bubbleColor).toBe(DEFAULT_CONFIG.roleThemes.vip.bubbleColor);
    expect(config.roleThemes.vip.assets.characterUrl).toBeNull();
    expect(config.roleThemes.vip.assets.decorationUrl).toBe('https://example.com/bone.webp');
  });
});
