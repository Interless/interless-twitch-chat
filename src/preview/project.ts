import { decodePreset, encodePreset } from '../config/preset';
import { normalizeCharacterPack, type CharacterPack } from '../domain/characterPack';

export function encodeProject(settings: unknown, pack: CharacterPack | null): string {
  return JSON.stringify({
    format: 'interless-chat-project',
    version: 1,
    preset: encodePreset(settings),
    pack: pack === null ? null : normalizeCharacterPack(pack),
  });
}

export function decodeProject(code: string): { preset: string; pack: CharacterPack | null } {
  if (code.length > 100 * 1024 * 1024) throw new Error('Файл проекта слишком большой.');
  const value: unknown = JSON.parse(code);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('format' in value) ||
    value.format !== 'interless-chat-project' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('preset' in value) ||
    typeof value.preset !== 'string' ||
    !('pack' in value)
  )
    throw new Error('Неподдерживаемый проект.');
  decodePreset(value.preset);
  return {
    preset: value.preset,
    pack: value.pack === null ? null : normalizeCharacterPack(value.pack),
  };
}
