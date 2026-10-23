import { loadedDinosaurs } from '../domain/characterRegistry';
import { DARK_PALETTE } from './palettes';
import type { ChatRole, RoleTheme, WidgetConfig } from '../domain/types';

function theme(overrides: Partial<RoleTheme>): RoleTheme {
  return {
    enabled: true,
    bubbleColor: '#eee4f8',
    headerColor: '#512080',
    textColor: '#54218b',
    nameColor: '#fff5ff',
    borderColor: '#9956cf',
    shadow: '0 2px 0 #5e238b',
    effectEnabled: true,
    assets: { characterUrl: null, decorationUrl: null },
    ...overrides,
  };
}

export const DEFAULT_ROLE_THEMES: Record<ChatRole, RoleTheme> = {
  broadcaster: theme({ headerColor: '#512080' }),
  lead_moderator: theme(DARK_PALETTE),
  moderator: theme({ headerColor: '#512080' }),
  vip: theme({ headerColor: '#512080' }),
  subscriber: theme(DARK_PALETTE),
  viewer: theme({}),
};

export const DEFAULT_CONFIG: WidgetConfig = {
  decorations: {
    enabled: true,
    icons: [
      'bone',
      'book',
      'ammonite',
      'hammer',
      'footprint',
      'skull',
      'trilobite',
      'fern',
      'brush',
      'flask',
      'beer',
    ],
    density: 25,
    chance: 100,
    frequency: 20,
    opacity: 0.18,
  },
  appearance: { colorScheme: 'roles', bubbleOpacity: 1, headerOpacity: 1 },
  general: {
    displayTimeMs: 12_000,
    maxMessages: 8,
    minWidth: 210,
    maxWidth: 260,
    fontFamily: 'Press Start 2P',
    fontSize: 16,
    lineHeight: 1.5,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    showBadges: true,
    showUserName: true,
    hideCommands: true,
    ignoredUsers: [],
  },
  layout: {
    scale: 1,
    alignment: 'left',
    horizontalOffset: 32,
    bottomOffset: 32,
    messageGap: 30,
    characterSide: 'alternating',
    characterSize: 172,
  },
  animation: {
    enter: 'pop',
    enterDurationMs: 320,
    exit: 'fade',
    exitDurationMs: 350,
    idleIntensity: 1,
    idleMotion: 'pixel',
    idleFrequency: 20,
  },
  roleThemes: DEFAULT_ROLE_THEMES,
  dinosaurs: loadedDinosaurs(),
  userDinosaurs: {},
};
