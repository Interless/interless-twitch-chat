import type { Dinosaur } from './types';
import { normalizeCharacterPack, type CharacterPack } from './characterPack';
export interface CharacterMetadata {
  name: string;
  command?: string;
  width: number;
  height: number;
  bounds: number[];
  mediaType?: 'image' | 'video';
  legacy: boolean;
  file?: string;
  sha256?: string;
  sourceFile?: string;
  sourceSha256?: string;
}
export const CHARACTER_URLS: Record<string, string> = {};
export const CHARACTER_CATALOG: Record<string, CharacterMetadata> = {};
export const CHARACTER_IDS = Object.keys(CHARACTER_URLS);
let currentPack: CharacterPack | null = null;
export function installCharacterPack(value: unknown): void {
  const pack = value === null ? null : normalizeCharacterPack(value);
  for (const key of Object.keys(CHARACTER_URLS)) Reflect.deleteProperty(CHARACTER_URLS, key);
  for (const key of Object.keys(CHARACTER_CATALOG)) Reflect.deleteProperty(CHARACTER_CATALOG, key);
  for (const [id, item] of Object.entries(pack?.characters ?? {})) {
    CHARACTER_URLS[id] = item.url;
    CHARACTER_CATALOG[id] = {
      name: item.name,
      command: item.command ?? id,
      width: item.width,
      height: item.height,
      bounds: item.bounds,
      ...(item.mediaType ? { mediaType: item.mediaType } : {}),
      legacy: false,
    };
  }
  CHARACTER_IDS.splice(0, CHARACTER_IDS.length, ...Object.keys(CHARACTER_URLS));
  currentPack = pack;
}
export function getCharacterPack(): CharacterPack | null {
  return currentPack;
}
export function updateCharacterCommand(id: string, command: string): void {
  const item = currentPack?.characters[id];
  if (!currentPack || !item) throw new Error('Персонаж не найден.');
  installCharacterPack({
    ...currentPack,
    characters: { ...currentPack.characters, [id]: { ...item, command } },
  });
}
const bootPack = (globalThis as { __INTERLESS_CHARACTER_PACK__?: unknown })
  .__INTERLESS_CHARACTER_PACK__;
if (bootPack !== undefined) installCharacterPack(bootPack);
export function loadedDinosaurs(): Record<string, Dinosaur> {
  return Object.fromEntries(
    CHARACTER_IDS.map((id) => [
      id,
      {
        name: CHARACTER_CATALOG[id]?.name ?? id,
        characterUrl: CHARACTER_URLS[id] ?? null,
      },
    ]),
  );
}
export function characterFrame(id: string): Record<`--${string}`, string> {
  const item = CHARACTER_CATALOG[id];
  if (!item) return {};
  const { width, height, bounds } = item;
  const [x = 0, y = 0, right = width, bottom = height] = bounds;
  const cw = right - x,
    ch = bottom - y,
    longest = Math.max(cw, ch);
  return {
    '--sprite-width': String((width / longest) * 100) + '%',
    '--sprite-height': String((height / longest) * 100) + '%',
    '--sprite-left': String((((longest - cw) / 2 - x) / longest) * 100) + '%',
    '--sprite-top': String((((longest - ch) / 2 - y) / longest) * 100) + '%',
  };
}
