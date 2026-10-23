import { migrateStoredCharacterId } from '../domain/characterIds';
export function preferenceKey(location: Pick<Location, 'pathname' | 'search'>): string {
  // Scope choices to this widget, without storing its URL or query parameters.
  let hash = 2166136261;
  for (const char of location.pathname + location.search) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  return `interless-chat:characters:v1:${(hash >>> 0).toString(16)}`;
}

export function loadCharacterPreferences(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(preferenceKey(window.location)) ?? '{}');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([userId, id]) =>
            userId.length > 0 &&
            userId.length <= 128 &&
            typeof id === 'string' &&
            /^[a-z][a-z0-9_-]{0,31}$/u.test(id),
        )
        .map(([id, character]) => [id, migrateStoredCharacterId(String(character))]),
    );
  } catch {
    return {};
  }
}

export function saveCharacterPreferences(preferences: Record<string, string>): void {
  try {
    localStorage.setItem(preferenceKey(window.location), JSON.stringify(preferences));
  } catch {
    // OBS may disallow storage: in-memory choices still work for this session.
  }
}
