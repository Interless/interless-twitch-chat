import { DEFAULT_CONFIG } from './defaults';
import type {
  ChatRole,
  EnterAnimation,
  ExitAnimation,
  Rectangle,
  RoleTheme,
  WidgetConfig,
} from '../domain/types';

const ROLES: readonly ChatRole[] = ['broadcaster', 'moderator', 'vip', 'subscriber', 'viewer'];
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

function safeZonesValue(value: unknown): Rectangle[] {
  let candidate: unknown = value;
  if (typeof value === 'string') {
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(candidate)) return [];

  return candidate.slice(0, 10).flatMap((zone) => {
    if (!isRecord(zone)) return [];
    const x = numberInRange(zone.x, 0, 0, 16_384);
    const y = numberInRange(zone.y, 0, 0, 16_384);
    const width = numberInRange(zone.width, 0, 0, 16_384);
    const height = numberInRange(zone.height, 0, 0, 16_384);
    return width > 0 && height > 0 ? [{ x, y, width, height }] : [];
  });
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
    textColor: colorValue(fields[`${prefix}TextColor`], fallback.textColor),
    nameColor: colorValue(fields[`${prefix}NameColor`], fallback.nameColor),
    borderColor: colorValue(fields[`${prefix}BorderColor`], fallback.borderColor),
    shadow: stringValue(fields[`${prefix}Shadow`], fallback.shadow),
    rotationOffset: numberInRange(fields[`${prefix}Rotation`], fallback.rotationOffset, -8, 8),
    effectEnabled: booleanValue(fields[`${prefix}Effects`], fallback.effectEnabled),
    assets: {
      characterUrl: normalizeAssetUrl(fields[`${prefix}Character`]),
      decorationUrl: normalizeAssetUrl(fields[`${prefix}Decoration`]),
    },
  };
}

export function normalizeConfig(value: unknown): WidgetConfig {
  const fields = isRecord(value) ? value : {};
  const defaults = DEFAULT_CONFIG;
  const minWidth = numberInRange(fields.minWidth, defaults.general.minWidth, 100, 600);
  const maxWidth = numberInRange(fields.maxWidth, defaults.general.maxWidth, minWidth, 900);
  const rawRotationMin = numberInRange(fields.rotationMin, defaults.placement.rotationMin, -15, 15);
  const rawRotationMax = numberInRange(fields.rotationMax, defaults.placement.rotationMax, -15, 15);

  const roleThemes = Object.fromEntries(
    ROLES.map((role) => [role, normalizeRoleTheme(fields, role, defaults.roleThemes[role])]),
  ) as Record<ChatRole, RoleTheme>;

  return {
    general: {
      displayTimeMs:
        numberInRange(fields.displayTimeSeconds, defaults.general.displayTimeMs / 1000, 2, 120) *
        1000,
      maxMessages: Math.round(
        numberInRange(fields.maxMessages, defaults.general.maxMessages, 1, 30),
      ),
      minWidth,
      maxWidth,
      fontFamily: stringValue(fields.fontFamily, defaults.general.fontFamily, 100),
      fontSize: numberInRange(fields.fontSize, defaults.general.fontSize, 10, 72),
      lineHeight: numberInRange(fields.lineHeight, defaults.general.lineHeight, 1, 2),
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
    placement: {
      edgePadding: numberInRange(fields.edgePadding, defaults.placement.edgePadding, 0, 300),
      messageGap: numberInRange(fields.messageGap, defaults.placement.messageGap, 0, 150),
      maxAttempts: Math.round(
        numberInRange(fields.maxAttempts, defaults.placement.maxAttempts, 1, 200),
      ),
      rotationMin: Math.min(rawRotationMin, rawRotationMax),
      rotationMax: Math.max(rawRotationMin, rawRotationMax),
      safeZones: safeZonesValue(fields.safeZones),
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
      idleIntensity: numberInRange(fields.idleIntensity, defaults.animation.idleIntensity, 0, 3),
    },
    roleThemes,
  };
}
