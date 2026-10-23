import { CHARACTER_CATALOG, CHARACTER_URLS } from '../domain/characterRegistry';
import {
  characterIdFromFilename,
  MAX_CHARACTER_BYTES,
  MAX_PACK_BYTES,
  normalizeCharacterPack,
  type CharacterPack,
} from '../domain/characterPack';
import { isVideoUrl } from '../domain/media';
const TYPES: Record<string, string> = {
  webm: 'video/webm',
  mp4: 'video/mp4',
  gif: 'image/gif',
  webp: 'image/webp',
  png: 'image/png',
  apng: 'image/apng',
};
function readFile(file: File, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Не удалось прочитать ' + file.name));
    r.onload = () =>
      typeof r.result === 'string'
        ? resolve(r.result.replace(/^data:[^;]*;/u, 'data:' + mime + ';'))
        : reject(new Error('Повреждённый файл.'));
    r.readAsDataURL(file);
  });
}
function dimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const media = isVideoUrl(url) ? document.createElement('video') : new Image();
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Файл не открывается.'));
    }, 15000);
    function cleanup() {
      clearTimeout(timer);
      media.removeAttribute('src');
      media.remove();
    }
    media.onerror = () => {
      cleanup();
      reject(new Error('Повреждённый или неподдерживаемый файл.'));
    };
    const ready = () => {
      const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
      const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
      cleanup();
      resolve({ width, height });
    };
    if (media instanceof HTMLVideoElement) {
      media.preload = 'metadata';
      media.muted = true;
      media.onloadedmetadata = ready;
    } else media.onload = ready;
    media.src = url;
  });
}
export async function importCharacterFolder(
  files: File[],
  measure = dimensions,
): Promise<CharacterPack> {
  const supported = files.filter((f) =>
    Object.hasOwn(TYPES, f.name.split('.').at(-1)?.toLowerCase() ?? ''),
  );
  if (!supported.length || supported.length > 50)
    throw new Error('Нужна папка с 1–50 файлами WebM/MP4/GIF/WebP/PNG/APNG.');
  if (supported.reduce((n, f) => n + f.size, 0) > MAX_PACK_BYTES)
    throw new Error('Общий размер больше 64 МБ.');
  const characters: CharacterPack['characters'] = {};
  for (const f of supported) {
    if (!f.size || f.size > MAX_CHARACTER_BYTES)
      throw new Error(f.name + ': пустой файл или размер больше 16 МБ.');
    const id = characterIdFromFilename(f.name);
    if (Object.hasOwn(characters, id)) throw new Error('Два файла дают команду !' + id);
    const mime = TYPES[f.name.split('.').at(-1)?.toLowerCase() ?? ''];
    if (!mime) continue;
    const url = await readFile(f, mime);
    const { width, height } = await measure(url);
    const known = CHARACTER_CATALOG[id];
    characters[id] = {
      name: f.name.replace(/\.[^.]+$/u, ''),
      ...(known?.command ? { command: known.command } : {}),
      url,
      width,
      height,
      bounds:
        known?.width === width && known.height === height && CHARACTER_URLS[id] === url
          ? known.bounds
          : [0, 0, width, height],
    };
  }
  return normalizeCharacterPack({ version: 1, characters });
}
