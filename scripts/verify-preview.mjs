import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = await readFile(
  new URL('../dist/streamelements/preview.html', import.meta.url),
  'utf8',
);
const errors = [];
const console = new VirtualConsole();
console.on('jsdomError', (error) => errors.push(error));
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://preview.example/interless',
  virtualConsole: console,
  beforeParse(window) {
    // jsdom does not lay out boxes; provide a compact measured card to exercise the controls.
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.hasAttribute('data-decorations') ? 206 : 0;
      },
    });
    Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return this.hasAttribute('data-decorations') ? 70 : 0;
      },
    });
  },
});
const { window } = dom;
const { document } = window;
const flush = () => new Promise((resolve) => setTimeout(resolve, 30));
try {
  await new Promise((resolve) => setTimeout(resolve, 220));
  assert.equal(document.querySelectorAll('article').length, 3);
  assert.equal(Object.keys(window.InterlessChat.catalog).length, 0);
  assert.equal(document.querySelectorAll('article img, article video').length, 0);
  assert.equal(document.getElementById('random-dinosaurs').disabled, true);
  assert.equal(document.getElementById('skel'), null);
  assert.equal(document.getElementById('dance'), null);

  const initial = [...document.querySelectorAll('article')];
  assert.deepEqual(
    initial.map((node) => node.dataset.messageSide),
    ['left', 'right', 'left'],
  );
  assert.deepEqual(
    initial.map((node) => node.dataset.characterSide),
    ['right', 'left', 'right'],
  );
  assert.equal(document.querySelector('[data-alignment]').dataset.alignment, 'left');
  const scale = document.getElementById('chat-scale');
  assert.ok(scale);
  assert.equal(scale.min, '25');
  assert.equal(scale.max, '200');
  scale.value = '150';
  scale.dispatchEvent(new window.Event('input', { bubbles: true }));
  await flush();
  assert.equal(document.querySelector('[data-chat-scale]').dataset.chatScale, '1.5');
  assert.equal(document.getElementById('chat-scale-value').textContent, '150%');
  scale.value = '100';
  scale.dispatchEvent(new window.Event('input', { bubbles: true }));
  await flush();
  assert.ok(initial.every((node) => node.style.alignSelf === ''));
  document.getElementById('sequence').click();
  await flush();
  const sequence = [...document.querySelectorAll('article')];
  assert.equal(sequence.length, 4);
  assert.deepEqual(
    sequence.map((node) => node.dataset.messageSide),
    ['left', 'right', 'left', 'right'],
  );
  assert.deepEqual(
    sequence.map((node) => node.dataset.characterSide),
    ['right', 'left', 'right', 'left'],
  );
  assert.ok(sequence.every((node) => node.dataset.userId === 'testviewer'));
  document.getElementById('clear').click();
  await flush();
  assert.equal(document.querySelectorAll('article').length, 0);

  document.getElementById('author').value = 'MyTester';
  document.getElementById('role').value = 'moderator';
  const text = document.getElementById('message');
  const send = async (value) => {
    text.value = value;
    document.querySelector('button[type="submit"]').click();
    await flush();
  };
  await send('Мой текст\nи ещё строка <script>window.pwned = true</script>');
  let article = document.querySelector('article');
  assert.match(article.textContent, /Мой текст\nи ещё строка/);
  assert.equal(window.pwned, undefined);
  assert.equal(article.dataset.userId, 'mytester');
  assert.equal(text.value, '');
  const side = article.dataset.messageSide;
  assert.equal(side, 'left');
  assert.equal(article.dataset.characterSide, 'right');
  window.InterlessChat.installCharacterPack({
    version: 1,
    characters: {
      alpha: {
        name: 'Alpha',
        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        width: 1,
        height: 1,
        bounds: [0, 0, 1, 1],
      },
      beta: {
        name: 'Beta',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        width: 1,
        height: 1,
        bounds: [0, 0, 1, 1],
      },
    },
  });
  window.applyImportedPreset(window.InterlessChat.encodePreset({}));
  await flush();
  await send('!alpha');
  assert.equal(document.querySelectorAll('article').length, 1);
  assert.equal(article.dataset.characterId, 'alpha');
  await send('Теперь я вело');
  article = [...document.querySelectorAll('article')].at(-1);
  assert.equal(article.dataset.characterId, 'alpha');
  assert.notEqual(article.dataset.messageSide, side);
  assert.match(window.localStorage.getItem(window.localStorage.key(0)), /"mytester":"alpha"/);

  text.value = 'Сообщение через Enter';
  text.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await flush();
  assert.match(
    [...document.querySelectorAll('article')].at(-1).textContent,
    /Сообщение через Enter/,
  );
  const count = document.querySelectorAll('article').length;
  text.value = 'Следующая строка';
  text.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
  );
  await flush();
  assert.equal(document.querySelectorAll('article').length, count);
  document.getElementById('send').click();
  await flush();
  assert.equal(document.querySelectorAll('article').length, count + 1);
  document.getElementById('background').click();
  assert.equal(document.body.classList.contains('light'), true);
  document.getElementById('clear').click();
  await flush();
  assert.equal(document.querySelectorAll('article').length, 0);
  document.getElementById('badges').click();
  await flush();
  assert.deepEqual(
    [...document.querySelectorAll('article [data-badge]')].map((node) => node.dataset.badge),
    ['cockroach', 'diamond', 'sword', 'hammer'],
  );
  document.getElementById('clear').click();
  await flush();
  assert.equal(document.querySelectorAll('article').length, 0);
  document.getElementById('sequence').click();
  await flush();
  const messageIds = [...document.querySelectorAll('article')].map(
    (node) => node.dataset.messageId,
  );
  const preset = document.getElementById('preset');
  preset.value = 'darkGlass';
  preset.dispatchEvent(new window.Event('change', { bubbles: true }));
  await flush();
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--bubble-fill') === 'rgba(75, 38, 120, 0.7)',
    ),
  );
  const opacity = document.getElementById('bubble-opacity');
  opacity.value = '0';
  opacity.dispatchEvent(new window.Event('input', { bubbles: true }));
  await flush();
  assert.equal(document.getElementById('bubble-opacity-value').textContent, '0%');
  assert.equal(document.getElementById('preset').value, 'custom');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--bubble-fill') === 'rgba(75, 38, 120, 0)',
    ),
  );
  assert.deepEqual(
    [...document.querySelectorAll('article')].map((node) => node.dataset.messageId),
    messageIds,
  );
  await send('!beta');
  await flush();
  const beforeRex = document.querySelectorAll('article').length;
  await send('Теперь второй динозаврик');
  assert.equal(document.querySelectorAll('article').length, beforeRex + 1);
  let last = [...document.querySelectorAll('article')].at(-1);
  assert.equal(last.dataset.characterId, 'beta');
  assert.ok(
    last
      .querySelector('[data-packed-id="beta"] img')
      .getAttribute('src')
      .startsWith('data:image/png;base64,'),
  );
  await send('!alpha');
  await flush();
  await send('Снова первый динозаврик');
  last = [...document.querySelectorAll('article')].at(-1);
  assert.equal(last.dataset.characterId, 'alpha');
  assert.ok(last.querySelector('[data-packed-id="alpha"] img'));
  const movementIds = [...document.querySelectorAll('article')].map(
    (node) => node.dataset.messageId,
  );
  const movement = document.getElementById('idle-motion');
  movement.value = 'chaotic';
  movement.dispatchEvent(new window.Event('change', { bubbles: true }));
  await flush();
  assert.ok(
    [...document.querySelectorAll('article')].every((node) => node.dataset.idle === 'chaotic'),
  );
  const frequency = document.getElementById('idle-frequency');
  frequency.value = '0';
  frequency.dispatchEvent(new window.Event('input', { bubbles: true }));
  await flush();
  assert.equal(document.getElementById('idle-frequency-value').textContent, '0%');
  assert.ok([...document.querySelectorAll('article')].every((node) => node.dataset.idle === 'off'));
  frequency.value = '75';
  frequency.dispatchEvent(new window.Event('input', { bubbles: true }));
  const distance = document.getElementById('idle-distance');
  distance.value = '6';
  distance.dispatchEvent(new window.Event('input', { bubbles: true }));
  await flush();
  assert.equal(document.getElementById('idle-distance-value').textContent, '6 px');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) =>
        node.dataset.idle === 'chaotic' && node.style.getPropertyValue('--idle-distance') === '6px',
    ),
  );
  assert.deepEqual(
    [...document.querySelectorAll('article')].map((node) => node.dataset.messageId),
    movementIds,
  );
  const paletteElement = document.getElementById('palette-element');
  const paletteHex = document.getElementById('palette-hex');
  const selectElement = (key) => {
    paletteElement.value = key;
    paletteElement.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const input = async (node, value) => {
    node.value = value;
    node.dispatchEvent(new window.Event('input', { bubbles: true }));
    await flush();
  };
  selectElement('textColor');
  await input(paletteHex, '#123456');
  assert.equal(document.getElementById('palette-r').value, '18');
  assert.equal(document.getElementById('palette-g').value, '52');
  assert.equal(document.getElementById('palette-b').value, '86');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--text-color') === '#123456',
    ),
  );
  await input(document.getElementById('palette-r'), '255');
  assert.equal(paletteHex.value, '#FF3456');
  await input(paletteHex, '#zzzzzz');
  assert.equal(paletteHex.getAttribute('aria-invalid'), 'true');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--text-color') === '#ff3456',
    ),
  );
  selectElement('boneColor');
  await input(document.getElementById('palette-color'), '#00ff80');
  assert.ok(
    [...document.querySelectorAll('article')].every((node) =>
      decodeURIComponent(node.style.getPropertyValue('--frame-image')).includes('fill="#00ff80"'),
    ),
  );
  selectElement('badgeColor');
  await input(paletteHex, '#ff8800');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--badge-color') === '#ff8800',
    ),
  );
  assert.deepEqual(JSON.parse(window.localStorage.getItem('interless-preview-palette-v1')), {
    textColor: '#ff3456',
    boneColor: '#00ff80',
    badgeColor: '#ff8800',
  });
  document.getElementById('palette-reset-element').click();
  await flush();
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) =>
        node.style.getPropertyValue('--badge-color') === '' &&
        node.style.getPropertyValue('--text-color') === '#ff3456',
    ),
  );
  document.getElementById('palette-reset-all').click();
  await flush();
  assert.equal(window.localStorage.getItem('interless-preview-palette-v1'), null);
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--frame-image') === '',
    ),
  );
  assert.deepEqual(
    [...document.querySelectorAll('article')].map((node) => node.dataset.messageId),
    movementIds,
  );
  const fontCatalog = JSON.parse(
    await readFile(new URL('../src/config/fontCatalog.json', import.meta.url), 'utf8'),
  );
  const fontSelector = document.getElementById('font-family');
  assert.equal(fontSelector.querySelectorAll('option').length, 10);
  const fontRows = [...document.querySelectorAll('article')].map((node) => ({
    id: node.dataset.messageId,
    side: node.dataset.messageSide,
    character: node.dataset.characterId,
  }));
  for (const font of fontCatalog) {
    fontSelector.value = font.family;
    fontSelector.dispatchEvent(new window.Event('change', { bubbles: true }));
    await flush();
    assert.ok(
      [...document.querySelectorAll('article')].every(
        (node) =>
          node.style.getPropertyValue('--font-family') === font.family &&
          node.style.getPropertyValue('--font-size') === font.size + 'px',
      ),
    );
    assert.equal(document.getElementById('font-size-value').textContent, font.size + ' px');
    assert.ok(document.getElementById('font-sample').style.fontFamily.includes(font.family));
    assert.deepEqual(
      [...document.querySelectorAll('article')].map((node) => ({
        id: node.dataset.messageId,
        side: node.dataset.messageSide,
        character: node.dataset.characterId,
      })),
      fontRows,
    );
  }
  await input(document.getElementById('font-size'), '32');
  assert.equal(document.getElementById('font-size-value').textContent, '32 px');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--font-size') === '32px',
    ),
  );
  assert.deepEqual(JSON.parse(window.localStorage.getItem('interless-preview-font-v1')), {
    fontFamily: 'Neucha',
    fontSize: 32,
  });
  fontSelector.value = 'Press Start 2P';
  fontSelector.dispatchEvent(new window.Event('change', { bubbles: true }));
  await flush();
  assert.equal(document.getElementById('font-size').value, '16');
  const decorationIds = [...document.querySelectorAll('article')].map(
    (node) => node.dataset.messageId,
  );
  await input(document.getElementById('decoration-density'), '100');
  await input(document.getElementById('decoration-frequency'), '0');
  assert.ok(
    [...document.querySelectorAll('[data-decorations]')].every(
      (node) =>
        node.querySelectorAll('[data-decoration]').length > 0 &&
        node.querySelectorAll('[data-decoration]').length <= 4,
    ),
  );
  const decorationIcons = JSON.parse(
    await readFile(new URL('../src/config/decorationIcons.json', import.meta.url), 'utf8'),
  );
  assert.equal(Object.keys(decorationIcons).length, 11);
  for (const kind of Object.keys(decorationIcons).filter((kind) => kind !== 'book')) {
    const toggle = document.getElementById('decoration-' + kind);
    toggle.checked = false;
    toggle.dispatchEvent(new window.Event('change', { bubbles: true }));
  }
  await flush();
  assert.ok(
    [...document.querySelectorAll('[data-decoration]')].every(
      (node) => node.dataset.decoration === 'book',
    ),
  );
  const book = document.getElementById('decoration-book');
  book.checked = false;
  book.dispatchEvent(new window.Event('change', { bubbles: true }));
  await flush();
  assert.equal(document.querySelectorAll('[data-decoration]').length, 0);
  book.checked = true;
  book.dispatchEvent(new window.Event('change', { bubbles: true }));
  await input(document.getElementById('decoration-chance'), '0');
  assert.equal(document.querySelectorAll('[data-decoration]').length, 0);
  await input(document.getElementById('decoration-chance'), '100');
  assert.equal(document.getElementById('decoration-opacity').max, '70');
  await input(document.getElementById('decoration-opacity'), '70');
  assert.ok(
    [...document.querySelectorAll('[data-decorations]')].every(
      (node) =>
        node.style.opacity === '0.7' &&
        node.querySelectorAll('[data-decoration]').length > 0 &&
        node.querySelectorAll('[data-decoration]').length <= 4,
    ),
  );
  // The added beer bottle has an independent switch and can be the only drawing.
  book.checked = false;
  book.dispatchEvent(new window.Event('change', { bubbles: true }));
  const beer = document.getElementById('decoration-beer');
  beer.checked = true;
  beer.dispatchEvent(new window.Event('change', { bubbles: true }));
  await flush();
  assert.ok(document.querySelectorAll('[data-decoration]').length > 0);
  assert.ok(
    [...document.querySelectorAll('[data-decoration]')].every(
      (node) => node.dataset.decoration === 'beer',
    ),
  );
  const savedDecorations = JSON.parse(
    window.localStorage.getItem('interless-preview-decorations-v1'),
  );
  assert.equal(savedDecorations.decorationbook, false);
  assert.equal(savedDecorations.decorationbeer, true);
  assert.equal(savedDecorations.decorationOpacity, 70);
  assert.equal(savedDecorations.decorationbone, false);
  assert.equal(savedDecorations.decorationDensity, 100);
  selectElement('decorationColor');
  await input(paletteHex, '#2244ff');
  assert.ok(
    [...document.querySelectorAll('article')].every(
      (node) => node.style.getPropertyValue('--decoration-color') === '#2244ff',
    ),
  );
  assert.deepEqual(
    [...document.querySelectorAll('article')].map((node) => node.dataset.messageId),
    decorationIds,
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    'Offline preview verified: composer, multiline text, safe text rendering, alternating sides, personal command, persistence, Enter/Shift+Enter controls, RGB palette ten bundled font choices and non-overlapping background icon controls.\n',
  );
} finally {
  window.close();
}
