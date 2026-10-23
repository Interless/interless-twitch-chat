// Migrate stored data only; these are not chat command aliases.
export function migrateStoredCharacterId(id: string): string {
  return id === 'velo' ? 'skel' : id === 'rex' ? 'dance' : id;
}
