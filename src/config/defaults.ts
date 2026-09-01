import type { ChatRole, RoleTheme, WidgetConfig } from '../domain/types';

function theme(overrides: Partial<RoleTheme>): RoleTheme {
  return {
    enabled: true,
    bubbleColor: '#334155',
    textColor: '#f8fafc',
    nameColor: '#e2e8f0',
    borderColor: '#94a3b8',
    shadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
    rotationOffset: 0,
    effectEnabled: true,
    assets: { characterUrl: null, decorationUrl: null },
    ...overrides,
  };
}

export const DEFAULT_ROLE_THEMES: Record<ChatRole, RoleTheme> = {
  broadcaster: theme({
    bubbleColor: '#7f1d1d',
    nameColor: '#fecaca',
    borderColor: '#f87171',
    rotationOffset: -1,
  }),
  moderator: theme({
    bubbleColor: '#14532d',
    nameColor: '#bbf7d0',
    borderColor: '#4ade80',
    rotationOffset: 1,
  }),
  vip: theme({
    bubbleColor: '#701a75',
    nameColor: '#f5d0fe',
    borderColor: '#e879f9',
    rotationOffset: -0.5,
  }),
  subscriber: theme({
    bubbleColor: '#312e81',
    nameColor: '#c7d2fe',
    borderColor: '#818cf8',
    rotationOffset: 0.5,
  }),
  viewer: theme({}),
};

export const DEFAULT_CONFIG: WidgetConfig = {
  general: {
    displayTimeMs: 12_000,
    maxMessages: 8,
    minWidth: 180,
    maxWidth: 420,
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 1.25,
    padding: 16,
    borderRadius: 22,
    borderWidth: 2,
    showBadges: true,
    showUserName: true,
    hideCommands: true,
    ignoredUsers: [],
  },
  placement: {
    edgePadding: 32,
    messageGap: 18,
    maxAttempts: 40,
    rotationMin: -3,
    rotationMax: 3,
    safeZones: [],
  },
  animation: {
    enter: 'pop',
    enterDurationMs: 320,
    exit: 'fade',
    exitDurationMs: 350,
    idleIntensity: 1,
  },
  roleThemes: DEFAULT_ROLE_THEMES,
};
