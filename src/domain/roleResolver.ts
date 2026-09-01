import type { ChatBadge, ChatRole } from './types';

/** Twitch roles are intentionally ordered in one place. The first match wins. */
export const ROLE_PRIORITY: readonly ChatRole[] = [
  'broadcaster',
  'moderator',
  'vip',
  'subscriber',
  'viewer',
] as const;

export interface RoleSignals {
  badges: ChatBadge[];
  isModerator: boolean;
  isSubscriber: boolean;
}

export function resolveRole(signals: RoleSignals): ChatRole {
  const badgeTypes = new Set(signals.badges.map((badge) => badge.type.toLowerCase()));
  const activeRoles = new Set<ChatRole>(['viewer']);

  if (badgeTypes.has('broadcaster')) activeRoles.add('broadcaster');
  if (badgeTypes.has('moderator') || signals.isModerator) activeRoles.add('moderator');
  if (badgeTypes.has('vip')) activeRoles.add('vip');
  if (badgeTypes.has('subscriber') || signals.isSubscriber) activeRoles.add('subscriber');

  return ROLE_PRIORITY.find((role) => activeRoles.has(role)) ?? 'viewer';
}
