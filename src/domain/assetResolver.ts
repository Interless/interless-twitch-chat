import type { ChatRole, RoleAssets } from './types';
import { CHARACTER_URLS, CHARACTER_IDS } from './characterRegistry';
export interface ResolvedRoleAssets extends RoleAssets {
  builtin: boolean;
  builtinId: string | null;
}
export function resolveRoleAssets(
  _role: ChatRole,
  assets: RoleAssets,
  characterId?: string | null,
): ResolvedRoleAssets {
  const characterUrl = assets.characterUrl ?? CHARACTER_URLS[CHARACTER_IDS[0] ?? ''] ?? null;
  const builtinId =
    CHARACTER_IDS.find((id) => id === characterId && characterUrl === CHARACTER_URLS[id]) ??
    CHARACTER_IDS.find((id) => characterUrl === CHARACTER_URLS[id]) ??
    null;
  return { ...assets, characterUrl, builtin: builtinId !== null, builtinId };
}
