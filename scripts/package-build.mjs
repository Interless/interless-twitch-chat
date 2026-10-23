import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { zipSync } from 'fflate';
import { createPreview } from './preview.mjs';
import { selectedFontCss } from '../src/preview/selectedFontCss.ts';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const installDirectory = resolve(distRoot, 'streamelements');
const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
const archiveName = `interless-twitch-chat-v${String(packageJson.version)}.zip`;
const archivePath = resolve(distRoot, archiveName);
const sourceFields = JSON.parse(
  await readFile(resolve(projectRoot, 'streamelements/fields.json'), 'utf8'),
);

await mkdir(installDirectory, { recursive: true });
await Promise.all([
  copyFile(
    resolve(projectRoot, 'streamelements/widget.html'),
    resolve(installDirectory, 'widget.html'),
  ),
  writeFile(
    resolve(installDirectory, 'fields.json'),
    JSON.stringify({ chatScale: sourceFields.chatScale }, null, 2),
  ),
  copyFile(resolve(projectRoot, 'docs/QUICKSTART.md'), resolve(installDirectory, 'INSTALL.md')),
]);

const fontCatalog = JSON.parse(
  await readFile(resolve(projectRoot, 'src/config/fontCatalog.json'), 'utf8'),
);
const fontLicenses = await Promise.all(
  fontCatalog.map(async (font) => {
    const license = await readFile(resolve(projectRoot, 'src/assets/fonts', font.license), 'utf8');
    return [font.family, 'Source: ' + font.source, 'SHA-256: ' + font.sha256, '', license].join(
      '\n',
    );
  }),
);
await writeFile(
  resolve(installDirectory, 'FONT-LICENSE.txt'),
  fontLicenses.join('\n\n------------------------------------------------------------\n\n'),
);

const characters = {};
await writeFile(resolve(installDirectory, 'DINOSAURS.json'), JSON.stringify(characters, null, 2));
const help =
  'Динозаврики ещё не загружены. Выбери свои файлы в preview.html. Список команд появится под галереей. Скопируй HTML/CSS/JS/FIELDS и загрузи файлы в группе «Динозаврики — медиатека» в настройках StreamElements.';
await writeFile(
  resolve(installDirectory, 'BOT-SETUP.txt'),
  'StreamElements Custom command: interless_chat\nResponse: ' +
    help +
    '\nAliases: dino, ichat (если свободны)\nВиджет не отправляет сообщения от имени бота.',
);
const requiredFiles = [
  'BOT-SETUP.txt',
  'DINOSAURS.json',
  'widget.html',
  'widget.css',
  'widget.js',
  'fields.json',
  'INSTALL.md',
  'FONT-LICENSE.txt',
];
const outputFiles = await readdir(installDirectory);
for (const fileName of requiredFiles) {
  if (!outputFiles.includes(fileName)) throw new Error(`Missing build output: ${fileName}`);
}
if (outputFiles.some((fileName) => fileName.endsWith('.map'))) {
  throw new Error('Production installation must not contain source maps');
}

const bundle = await readFile(resolve(installDirectory, 'widget.js'), 'utf8');
const forbiddenMarkers = [
  'OPEN FONT LICENSE',
  'Bundled font licenses',
  'installDevFixture',
  'dev-message-',
  'Download the React DevTools',
  'process.env.NODE_ENV',
  'sourceMappingURL=',
  'from "react"',
  "from 'react'",
];
for (const marker of forbiddenMarkers) {
  if (bundle.includes(marker))
    throw new Error(`Production bundle contains forbidden marker: ${marker}`);
}

if (/data:(?:video\/(?:webm|mp4)|image\/(?:gif|png|webp|apng));base64,[a-z0-9+/]/iu.test(bundle)) {
  throw new Error('Base widget must not contain shipped character media');
}

JSON.parse(await readFile(resolve(installDirectory, 'fields.json'), 'utf8'));

const css = await readFile(resolve(installDirectory, 'widget.css'), 'utf8');
const preview = createPreview(css, bundle);
await writeFile(resolve(installDirectory, 'preview.html'), preview);
await writeFile(resolve(installDirectory, 'widget.css'), selectedFontCss(css, 'Press Start 2P'));
requiredFiles.push('preview.html');

const zipEntries = Object.fromEntries(
  await Promise.all(
    requiredFiles.map(async (fileName) => [
      fileName,
      await readFile(resolve(installDirectory, fileName)),
    ]),
  ),
);
const archive = zipSync(zipEntries, {
  level: 9,
  mtime: new Date(1980, 0, 2),
});
await writeFile(archivePath, archive);

const checksum = createHash('sha256').update(archive).digest('hex');
await writeFile(`${archivePath}.sha256`, `${checksum}  ${archiveName}\n`, 'utf8');

process.stdout.write(`Created ${archiveName} and SHA-256 checksum.\n`);
