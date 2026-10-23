export interface PackedCharacter {
  name: string;
  url: string;
  width: number;
  height: number;
  bounds: number[];
  mediaType?: 'image' | 'video';
  command?: string;
}
export interface CharacterPack {
  version: 1;
  characters: Record<string, PackedCharacter>;
}
export const MAX_CHARACTER_BYTES = 16 * 1024 * 1024;
export const MAX_PACK_BYTES = 64 * 1024 * 1024;
export function characterIdFromFilename(filename: string): string {
  const chars = Array.from('абвгдеёжзийклмнопрстуфхцчшщъыьэюя');
  const latin = [
    'a',
    'b',
    'v',
    'g',
    'd',
    'e',
    'yo',
    'zh',
    'z',
    'i',
    'y',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'r',
    's',
    't',
    'u',
    'f',
    'kh',
    'ts',
    'ch',
    'sh',
    'sch',
    '',
    'y',
    '',
    'e',
    'yu',
    'ya',
  ];
  let id = Array.from(filename.replace(/\.[^.]+$/u, '').toLowerCase())
    .map((c) => {
      const n = chars.indexOf(c);
      return n < 0 ? c : (latin[n] ?? '');
    })
    .join('')
    .replace(/^!/u, '')
    .replace(/[^a-z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  if (!/^[a-z]/u.test(id)) id = 'dino' + id;
  id = id.slice(0, 32);
  if (!validCharacterId(id)) throw new Error('Переименуй файл: ' + filename);
  return id;
}
export function validCharacterId(id: string): boolean {
  return (
    /^[a-z][a-z0-9_-]{0,31}$/u.test(id) &&
    !['velo', 'rex', 'dino', 'ichat', 'interless_chat', 'constructor', 'prototype'].includes(id)
  );
}
export function normalizeCharacterCommand(value: unknown): string {
  const command = typeof value === 'string' ? value.trim().replace(/^!/u, '').toLowerCase() : '';
  if (
    !/^[\p{L}][\p{L}\p{N}_-]{0,31}$/u.test(command) ||
    ['dino', 'ichat', 'interless_chat', 'constructor', 'prototype'].includes(command)
  )
    throw new Error('Команда: 1–32 буквы/цифры, _ или -, первая — буква. !dino и !ichat заняты.');
  return command;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isHttpsMediaUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 4096) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function normalizeCharacterPack(value: unknown): CharacterPack {
  if (!record(value) || value.version !== 1 || !record(value.characters))
    throw new Error('Некорректный набор.');
  const entries = Object.entries(value.characters);
  if (!entries.length || entries.length > 50) throw new Error('Нужно от 1 до 50 файлов.');
  const characters: Record<string, PackedCharacter> = {};
  const commands = new Set<string>();
  let total = 0;
  for (const [id, item] of entries) {
    if (!validCharacterId(id) || !record(item)) throw new Error('Недопустимая команда: ' + id);
    const command = normalizeCharacterCommand(item.command ?? id);
    if (commands.has(command)) throw new Error('Команда !' + command + ' уже занята.');
    commands.add(command);
    const { url, width, height, bounds } = item;
    if (
      typeof url !== 'string' ||
      (!isHttpsMediaUrl(url) &&
        !/^data:(?:video\/(?:webm|mp4)|image\/(?:gif|png|webp|apng));base64,/iu.test(url))
    )
      throw new Error('Неподдерживаемый файл: ' + id);
    if (!isHttpsMediaUrl(url)) {
      const data = url.slice(url.indexOf(',') + 1);
      total += (data.length * 3) / 4;
      if (
        !data.length ||
        /[^a-z0-9+/=]/iu.test(data) ||
        data.length > Math.ceil(MAX_CHARACTER_BYTES / 3) * 4 ||
        total > MAX_PACK_BYTES
      )
        throw new Error('Повреждённый файл или превышен лимит размера: ' + id);
    }
    if (item.mediaType !== undefined && item.mediaType !== 'image' && item.mediaType !== 'video')
      throw new Error('Некорректный тип медиа: ' + id);
    if (
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > 4096 ||
      height > 4096
    )
      throw new Error('Некорректные размеры: ' + id);
    if (
      !Array.isArray(bounds) ||
      bounds.length !== 4 ||
      !bounds.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))
    )
      throw new Error('Некорректные границы: ' + id);
    const [left, top, right, bottom] = bounds as number[];
    if (
      left === undefined ||
      top === undefined ||
      right === undefined ||
      bottom === undefined ||
      left < 0 ||
      top < 0 ||
      right > width ||
      bottom > height ||
      left >= right ||
      top >= bottom
    )
      throw new Error('Некорректные границы: ' + id);
    characters[id] = {
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 80) : id,
      command,
      url,
      width,
      height,
      bounds: [left, top, right, bottom],
      mediaType:
        item.mediaType === 'video' ||
        (item.mediaType === undefined &&
          (/^data:video\//iu.test(url) || /\.(?:webm|mp4)(?:[?#]|$)/iu.test(url)))
          ? 'video'
          : 'image',
    };
  }
  return { version: 1, characters };
}
