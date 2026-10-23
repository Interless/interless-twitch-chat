import {
  isHttpsMediaUrl,
  normalizeCharacterPack,
  normalizeCharacterCommand,
  type CharacterPack,
  type PackedCharacter,
} from './characterPack';

export interface MediaLibraryManifest {
  version: 1;
  characters: Record<string, Omit<PackedCharacter, 'url'> & { url: string }>;
}

export function mediaFieldKey(id: string): string {
  return 'dinoMedia_' + id;
}
export function commandFieldKey(id: string): string {
  return 'dinoCommand_' + id;
}

// Keep metadata and remote addresses only. Source files stay in the offline project.
export function createMediaLibrary(pack: CharacterPack | null): {
  manifest: MediaLibraryManifest | null;
  fields: Record<string, unknown>;
} {
  if (pack === null) return { manifest: null, fields: {} };
  const normalized = normalizeCharacterPack(pack);
  const characters: MediaLibraryManifest['characters'] = {};
  const fields: Record<string, unknown> = {};
  for (const [id, item] of Object.entries(normalized.characters)) {
    const url = isHttpsMediaUrl(item.url) ? item.url : '';
    characters[id] = { ...item, url };
    fields[commandFieldKey(id)] = {
      type: 'text',
      label: 'Команда: ' + item.name,
      group: 'Динозаврики — медиатека',
      value: '!' + (item.command ?? id),
    };
    fields[mediaFieldKey(id)] = {
      type: item.mediaType === 'video' ? 'video-input' : 'image-input',
      label: 'Файл: ' + item.name,
      group: 'Динозаврики — медиатека',
      value: url,
    };
  }
  return { manifest: { version: 1, characters }, fields };
}

export function resolveMediaLibraryPack(
  manifest: MediaLibraryManifest | null,
  fieldData: unknown,
): CharacterPack | null {
  if (manifest === null) return null;
  const fields =
    typeof fieldData === 'object' && fieldData !== null
      ? (fieldData as Record<string, unknown>)
      : {};
  const characters: CharacterPack['characters'] = {};
  const defaults = Object.fromEntries(
    Object.entries(manifest.characters).map(([id, item]) => [id, item.command ?? id]),
  );
  const commands = { ...defaults };
  for (const id of Object.keys(commands)) {
    const key = commandFieldKey(id);
    if (!Object.hasOwn(fields, key)) continue;
    try {
      commands[id] = normalizeCharacterCommand(fields[key]);
    } catch {
      // A malformed native field keeps the command configured in the preview.
    }
  }
  // Roll conflicting edits back to their unique preview defaults, including collision chains.
  let changed: boolean;
  do {
    changed = false;
    const counts = new Map<string, number>();
    for (const command of Object.values(commands))
      counts.set(command, (counts.get(command) ?? 0) + 1);
    for (const [id, command] of Object.entries(commands)) {
      if ((counts.get(command) ?? 0) > 1 && command !== defaults[id]) {
        commands[id] = defaults[id] ?? id;
        changed = true;
      }
    }
  } while (changed);
  for (const [id, item] of Object.entries(manifest.characters)) {
    const key = mediaFieldKey(id);
    const url = Object.hasOwn(fields, key) ? fields[key] : item.url;
    // An empty or removed selection leaves this character unavailable.
    if (typeof url === 'string' && isHttpsMediaUrl(url))
      characters[id] = { ...item, url, command: commands[id] ?? id };
  }
  return Object.keys(characters).length ? normalizeCharacterPack({ version: 1, characters }) : null;
}
