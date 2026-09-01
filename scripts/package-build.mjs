import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { zipSync } from 'fflate';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const installDirectory = resolve(distRoot, 'streamelements');
const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
const archiveName = `interless-twitch-chat-v${String(packageJson.version)}.zip`;
const archivePath = resolve(distRoot, archiveName);

await mkdir(installDirectory, { recursive: true });
await Promise.all([
  copyFile(
    resolve(projectRoot, 'streamelements/widget.html'),
    resolve(installDirectory, 'widget.html'),
  ),
  copyFile(
    resolve(projectRoot, 'streamelements/fields.json'),
    resolve(installDirectory, 'fields.json'),
  ),
  copyFile(
    resolve(projectRoot, 'docs/INSTALL_STREAM_ELEMENTS.md'),
    resolve(installDirectory, 'INSTALL.md'),
  ),
]);

const requiredFiles = ['widget.html', 'widget.css', 'widget.js', 'fields.json', 'INSTALL.md'];
const outputFiles = await readdir(installDirectory);
for (const fileName of requiredFiles) {
  if (!outputFiles.includes(fileName)) throw new Error(`Missing build output: ${fileName}`);
}
if (outputFiles.some((fileName) => fileName.endsWith('.map'))) {
  throw new Error('Production installation must not contain source maps');
}

const bundle = await readFile(resolve(installDirectory, 'widget.js'), 'utf8');
const forbiddenMarkers = [
  'installDevFixture',
  'dev-message-',
  'sourceMappingURL=',
  'from "react"',
  "from 'react'",
];
for (const marker of forbiddenMarkers) {
  if (bundle.includes(marker))
    throw new Error(`Production bundle contains forbidden marker: ${marker}`);
}

JSON.parse(await readFile(resolve(installDirectory, 'fields.json'), 'utf8'));

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
  mtime: new Date('1980-01-01T00:00:00.000Z'),
});
await writeFile(archivePath, archive);

const checksum = createHash('sha256').update(archive).digest('hex');
await writeFile(`${archivePath}.sha256`, `${checksum}  ${archiveName}\n`, 'utf8');

process.stdout.write(`Created ${archiveName} and SHA-256 checksum.\n`);
