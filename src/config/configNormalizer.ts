import { applyPresetFields } from './preset';
import { loadedDinosaurs } from '../domain/characterRegistry';
import { migrateStoredCharacterId } from '../domain/characterIds';
import paletteTokens from './paletteTokens.json';
import decorationIcons from './decorationIcons.json';
import { DEFAULT_CONFIG } from './defaults';
import type {
  ChatAlignment,
  ChatRole,
  CustomColors,
  DecorationKind,
  PaletteKey,
  Dinosaur,
  EnterAnimation,
  ExitAnimation,
  RoleTheme,
  WidgetConfig,
} from '../domain/types';

const ROLES: readonly ChatRole[] = [
  'broadcaster',
  'lead_moderator',
  'moderator',
  'vip',
  'subscriber',
  'viewer',
];
const HEX_COLOR = /^#[\da-f]{6}(?:[\da-f]{2})?$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberInRange(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return fallback;
}

function stringValue(value: unknown, fallback: string, maxLength = 200): string {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

export function normalizeAssetUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeRoleTheme(
  fields: Record<string, unknown>,
  role: ChatRole,
  fallback: RoleTheme,
): RoleTheme {
  const prefix = `${role}Theme`;
  return {
    enabled: booleanValue(fields[`${prefix}Enabled`], fallback.enabled),
    bubbleColor: colorValue(fields[`${prefix}BubbleColor`], fallback.bubbleColor),
    headerColor: colorValue(fields[`${prefix}HeaderColor`], fallback.headerColor),
    textColor: colorValue(fields[`${prefix}TextColor`], fallback.textColor),
    nameColor: colorValue(fields[`${prefix}NameColor`], fallback.nameColor),
    borderColor: colorValue(fields[`${prefix}BorderColor`], fallback.borderColor),
    shadow: stringValue(fields[`${prefix}Shadow`], fallback.shadow),
    effectEnabled: booleanValue(fields[`${prefix}Effects`], fallback.effectEnabled),
    assets: {
      characterUrl: normalizeAssetUrl(fields[`${prefix}Character`]),
      decorationUrl: normalizeAssetUrl(fields[`${prefix}Decoration`]),
    },
  };
}

function jsonRecord(value: unknown): Record<string, unknown> | null {
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeDinosaurs(value: unknown): Record<string, Dinosaur> {
  const entries = jsonRecord(value);
  const loaded = loadedDinosaurs();
  if (entries === null) return loaded;
  const dinosaurs: Record<string, Dinosaur> = { ...loaded };
  for (const [storedId, entry] of Object.entries(entries).slice(0, 100)) {
    const id = migrateStoredCharacterId(storedId);
    if (!/^[a-z][a-z0-9_-]{0,31}$/u.test(id) || !isRecord(entry)) continue;
    const characterUrl = normalizeAssetUrl(entry.url);
    if (entry.url !== '' && entry.url !== null && characterUrl === null) continue;
    if (characterUrl === null && !loaded[id]) continue;
    dinosaurs[id] = {
      name: stringValue(entry.name, id, 80),
      characterUrl: characterUrl ?? loaded[id]?.characterUrl ?? null,
    };
  }
  return dinosaurs;
}

function normalizeUserDinosaurs(
  value: unknown,
  dinosaurs: Record<string, Dinosaur>,
): Record<string, string> {
  const assignments: Record<string, string> = {};
  for (const [login, storedId] of Object.entries(jsonRecord(value) ?? {}).slice(0, 5000)) {
    const id = typeof storedId === 'string' ? migrateStoredCharacterId(storedId) : null;
    if (
      /^[a-z0-9_]{1,25}$/iu.test(login) &&
      typeof id === 'string' &&
      Object.hasOwn(dinosaurs, id)
    ) {
      assignments[login.toLowerCase()] = id;
    }
  }
  return assignments;
}

function normalizeCustomColors(value: unknown): CustomColors {
  const colors: CustomColors = {};
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return colors;
    }
  }
  if (!isRecord(value)) return colors;
  for (const key of Object.keys(paletteTokens) as PaletteKey[]) {
    const color = value[key];
    if (typeof color === 'string' && /^#[\da-f]{6}$/iu.test(color)) colors[key] = color;
  }
  return colors;
}

export function normalizeConfig(value: unknown): WidgetConfig {
  const fields = applyPresetFields(value);
  const defaults = DEFAULT_CONFIG;
  const customColors = normalizeCustomColors(fields.customColors);
  const retiredFont = fields.fontFamily === 'Interless Pixel';
  const dinosaurs = normalizeDinosaurs(fields.dinosaurCatalog);
  const minWidth = numberInRange(fields.minWidth, defaults.general.minWidth, 100, 600);
  const maxWidth = numberInRange(fields.maxWidth, defaults.general.maxWidth, minWidth, 900);

  const roleThemes = Object.fromEntries(
    ROLES.map((role) => [role, normalizeRoleTheme(fields, role, defaults.roleThemes[role])]),
  ) as Record<ChatRole, RoleTheme>;

  return {
    decorations: {
      enabled: booleanValue(fields.decorationsEnabled, defaults.decorations.enabled),
      icons: (Object.keys(decorationIcons) as DecorationKind[]).filter((kind) =>
        booleanValue(fields[`decoration${kind}`], defaults.decorations.icons.includes(kind)),
      ),
      density: numberInRange(fields.decorationDensity, defaults.decorations.density, 0, 100),
      chance: numberInRange(fields.decorationChance, defaults.decorations.chance, 0, 100),
      frequency: numberInRange(fields.decorationFrequency, defaults.decorations.frequency, 0, 100),
      opacity:
        numberInRange(fields.decorationOpacity, defaults.decorations.opacity * 100, 0, 70) / 100,
    },
    appearance: {
      ...(Object.keys(customColors).length > 0 ? { customColors } : {}),
      colorScheme: enumValue(
        fields.colorScheme,
        ['roles', 'light', 'dark'] as const,
        defaults.appearance.colorScheme,
      ),
      bubbleOpacity:
        numberInRange(fields.bubbleOpacity, defaults.appearance.bubbleOpacity * 100, 0, 100) / 100,
      headerOpacity:
        numberInRange(fields.headerOpacity, defaults.appearance.headerOpacity * 100, 0, 100) / 100,
    },
    general: {
      displayTimeMs:
        numberInRange(fields.displayTimeSeconds, defaults.general.displayTimeMs / 1000, 2, 120) *
        1000,
      maxMessages: Math.round(
        numberInRange(fields.maxMessages, defaults.general.maxMessages, 1, 30),
      ),
      minWidth,
      maxWidth,
      fontFamily: retiredFont
        ? defaults.general.fontFamily
        : stringValue(fields.fontFamily, defaults.general.fontFamily, 100),
      fontSize: retiredFont
        ? defaults.general.fontSize
        : numberInRange(fields.fontSize, defaults.general.fontSize, 10, 72),
      lineHeight: retiredFont
        ? defaults.general.lineHeight
        : numberInRange(fields.lineHeight, defaults.general.lineHeight, 1, 2),
      padding: numberInRange(fields.padding, defaults.general.padding, 4, 48),
      borderRadius: numberInRange(fields.borderRadius, defaults.general.borderRadius, 0, 80),
      borderWidth: numberInRange(fields.borderWidth, defaults.general.borderWidth, 0, 12),
      showBadges: booleanValue(fields.showBadges, defaults.general.showBadges),
      showUserName: booleanValue(fields.showUserName, defaults.general.showUserName),
      hideCommands: booleanValue(fields.hideCommands, defaults.general.hideCommands),
      ignoredUsers: stringValue(fields.ignoredUsers, '', 2000)
        .split(/[\s,;]+/u)
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 100),
    },
    layout: {
      scale: numberInRange(fields.chatScale, defaults.layout.scale * 100, 25, 200) / 100,
      alignment: enumValue<ChatAlignment>(
        fields.chatAlignment,
        ['left', 'center', 'right'],
        defaults.layout.alignment,
      ),
      horizontalOffset: numberInRange(
        fields.horizontalOffset,
        defaults.layout.horizontalOffset,
        0,
        600,
      ),
      bottomOffset: numberInRange(fields.bottomOffset, defaults.layout.bottomOffset, 0, 600),
      messageGap: numberInRange(fields.messageGap, defaults.layout.messageGap, 0, 150),
      characterSide: enumValue(
        fields.characterSide,
        ['alternating', 'left', 'right'] as const,
        defaults.layout.characterSide,
      ),
      characterSize: numberInRange(fields.characterSize, defaults.layout.characterSize, 64, 280),
    },
    animation: {
      enter: enumValue<EnterAnimation>(
        fields.enterAnimation,
        ['pop', 'fade', 'slide'],
        defaults.animation.enter,
      ),
      enterDurationMs: numberInRange(
        fields.enterDurationMs,
        defaults.animation.enterDurationMs,
        0,
        3000,
      ),
      exit: enumValue<ExitAnimation>(
        fields.exitAnimation,
        ['fade', 'shrink', 'slide'],
        defaults.animation.exit,
      ),
      exitDurationMs: numberInRange(
        fields.exitDurationMs,
        defaults.animation.exitDurationMs,
        0,
        3000,
      ),
      idleMotion: enumValue(
        fields.idleMotion,
        ['off', 'float', 'pixel', 'chaotic'] as const,
        defaults.animation.idleMotion,
      ),
      idleFrequency: numberInRange(fields.idleFrequency, defaults.animation.idleFrequency, 0, 100),
      idleIntensity: numberInRange(fields.idleIntensity, defaults.animation.idleIntensity, 0, 3),
    },
    roleThemes,
    dinosaurs,
    userDinosaurs: normalizeUserDinosaurs(fields.userDinosaurs, dinosaurs),
  };
}
