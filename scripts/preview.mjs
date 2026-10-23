import { readFileSync } from 'node:fs';
const template = readFileSync(new URL('./preview-template.html', import.meta.url), 'utf8');
const controller = readFileSync(new URL('./folder-controller.js', import.meta.url), 'utf8');
const fields = readFileSync(new URL('../streamelements/fields.json', import.meta.url), 'utf8');
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export function createPreview(css, bundle) {
  const html = template
    .replace('Interless 0.13.0', 'Interless ' + version)
    .replace('__INTERLESS_CSS_SLOT__', () => css)
    .replace('__INTERLESS_BUNDLE_SLOT__', () => bundle.replace(/<\/script/giu, '<\\/script'));
  return html.replace(
    '</body>',
    () =>
      '<script>' +
      controller.replace('__INTERLESS_FIELDS_SLOT__;', () => fields + ';') +
      '</script></body>',
  );
}
