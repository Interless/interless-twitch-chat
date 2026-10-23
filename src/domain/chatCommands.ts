import { CHARACTER_CATALOG } from './characterRegistry';
import { migrateStoredCharacterId } from './characterIds';
import { normalizeCharacterCommand } from './characterPack';
export function isHelpCommand(text: string): boolean {
  return ['!dino', '!ichat', '!interless_chat'].includes(text.trim().toLowerCase());
}
export function characterIdForCommand(
  text: string,
  legacyCatalog: Readonly<Record<string, unknown>> = {},
): string | undefined {
  if (!text.trim().startsWith('!')) return undefined;
  let command: string;
  try {
    command = normalizeCharacterCommand(text);
  } catch {
    return undefined;
  }
  const match = Object.entries(CHARACTER_CATALOG).find(
    ([id, item]) => (item.command ?? id) === command,
  );
  if (match) return match[0];
  // Legacy URL-only catalogs still use IDs as commands; renamed packed IDs are not aliases.
  return !Object.hasOwn(CHARACTER_CATALOG, command) &&
    Object.hasOwn(legacyCatalog, command) &&
    migrateStoredCharacterId(command) === command
    ? command
    : undefined;
}
export function dinosaurHelp(): string {
  if (!Object.keys(CHARACTER_CATALOG).length) return 'Динозаврики ещё не загружены.';
  return (
    'Выбери динозаврика: ' +
    Object.entries(CHARACTER_CATALOG)
      .map(([id, item]) => '!' + (item.command ?? id) + ' — ' + item.name)
      .join('; ') +
    '. Напиши команду — следующие сообщения будут с ним.'
  );
}
