import type { ChatRole, RoleAssets } from './types';

const PLACEHOLDER_CHARACTER: Record<ChatRole, string> = {
  broadcaster: '💀',
  moderator: '☠️',
  vip: '🦴',
  subscriber: '💀',
  viewer: '☠️',
};

export interface ResolvedRoleAssets extends RoleAssets {
  placeholder: string;
}

export function resolveRoleAssets(role: ChatRole, assets: RoleAssets): ResolvedRoleAssets {
  return { ...assets, placeholder: PLACEHOLDER_CHARACTER[role] };
}
