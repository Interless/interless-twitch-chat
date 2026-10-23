import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
const root = new URL('../dist/streamelements/', import.meta.url);
const html = await readFile(new URL('preview.html', root), 'utf8');
const errors = [];
const logs = new VirtualConsole();
logs.on('jsdomError', (error) => errors.push(error.message));
const sleep = () => new Promise((resolve) => setTimeout(resolve, 250));
let savedBlob;
let clipboardText;
let clipboardFails = false;
let downloadCount = 0;
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://preview.test/',
  virtualConsole: logs,
  beforeParse(window) {
    window.structuredClone = structuredClone;
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (code) => {
          if (clipboardFails) throw new Error('Clipboard denied');
          clipboardText = code;
        },
      },
    });
    window.URL.createObjectURL = (blob) => {
      savedBlob = blob;
      return 'blob:test-download';
    };
    window.URL.revokeObjectURL = () => {
      /* Download URL is a test stub. */
    };
    window.HTMLAnchorElement.prototype.click = () => {
      downloadCount++; // Project saving only; clipboard buttons must never download.
    };
  },
});
let cold;
try {
  await sleep();
  const api = dom.window.InterlessChat;
  assert.ok(dom.window.document.getElementById('choose-dino-folder'));
  assert.equal(dom.window.document.querySelectorAll('#transfer-editor [data-copy-tab]').length, 4);
  assert.equal(dom.window.document.getElementById('widget-export'), null);
  assert.ok(dom.window.document.getElementById('project-save'));
  assert.ok(dom.window.document.getElementById('project-file'));
  assert.equal(
    dom.window.document.querySelectorAll('#dino-gallery [data-character-card]').length,
    0,
  );
  assert.deepEqual(Object.keys(api.catalog), []);
  assert.equal(dom.window.document.querySelectorAll('article img, article video').length, 0);
  const pack = {
    version: 1,
    characters: {
      newdino: {
        name: 'Мой динозаврик',
        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        width: 1,
        height: 1,
        bounds: [0, 0, 1, 1],
      },
    },
  };
  api.installCharacterPack(pack);
  dom.window.document.getElementById('project-save').click();
  const projectText = await new Promise((resolve, reject) => {
    const reader = new dom.window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(savedBlob);
  });
  assert.equal(api.decodeProject(projectText).pack.characters.newdino.name, 'Мой динозаврик');
  api.installCharacterPack(null);
  const projectFile = dom.window.document.getElementById('project-file');
  Object.defineProperty(projectFile, 'files', {
    configurable: true,
    value: [{ size: projectText.length, text: async () => projectText }],
  });
  await projectFile.onchange({ target: projectFile });
  await sleep();
  assert.ok(dom.window.document.querySelector('[data-character-card="newdino"]'));
  assert.deepEqual(Object.keys(api.catalog), ['newdino']);
  assert.equal(dom.window.document.getElementById('random-dinosaurs').disabled, false);
  assert.match(
    dom.window.document.getElementById('widget-export-status').textContent,
    /Проект открыт/u,
  );
  // Rename from the real preview control, then persist and reopen without changing the media ID.
  const commandInput = dom.window.document.getElementById('dino-command-newdino');
  commandInput.value = '!Боня';
  dom.window.document.querySelector('[data-command-form="newdino"] button[type="submit"]').click();
  await sleep();
  assert.equal(api.catalog.newdino.command, 'боня');
  assert.equal(api.characterIdForCommand('!БОНЯ'), 'newdino');
  assert.equal(api.characterIdForCommand('!newdino'), undefined);
  assert.equal(
    dom.window.document.querySelector('[data-choose-character="newdino"]').textContent,
    '!боня',
  );
  assert.ok(dom.window.document.getElementById('bot-help').textContent.includes('!боня'));
  const renamedProject = api.encodeProject({}, api.getCharacterPack());
  assert.equal(api.decodeProject(renamedProject).pack.characters.newdino.command, 'боня');
  assert.equal(api.getCharacterPack().characters.newdino.url, pack.characters.newdino.url);
  const invalidCommand = dom.window.document.getElementById('dino-command-newdino');
  invalidCommand.value = '!dino';
  dom.window.document.querySelector('[data-command-form="newdino"] button[type="submit"]').click();
  assert.equal(invalidCommand.getAttribute('aria-invalid'), 'true');
  assert.equal(api.catalog.newdino.command, 'боня');
  invalidCommand.value = '!боня';
  dom.window.applyImportedPreset(
    api.encodePreset({
      fontFamily: 'Tiny5',
      fontSize: 24,
      characterSize: 180,
      chatScale: 125,
      bubbleOpacity: 37,
      headerOpacity: 64,
      decorationOpacity: 70,
      decorationDensity: 82,
      decorationbeer: false,
      customColors: { textColor: '#112233', badgeColor: '#abcdef' },
    }),
  );
  const code = {};
  const downloadsBeforeCopy = downloadCount;
  for (const tab of ['HTML', 'CSS', 'JS', 'FIELDS']) {
    await dom.window.document.querySelector('[data-copy-tab="' + tab + '"]').onclick();
    code[tab] = clipboardText;
    assert.match(
      dom.window.document.getElementById('widget-export-status').textContent,
      new RegExp('Код ' + tab + ' скопирован', 'u'),
    );
    assert.equal(dom.window.document.getElementById('copy-fallback').hidden, true);
  }
  assert.equal(downloadCount, downloadsBeforeCopy);
  assert.equal(code.HTML, '<div id="root"></div>');
  for (const [tab, content] of Object.entries(code)) {
    assert.doesNotMatch(
      content,
      /OPEN FONT LICENSE|Bundled font licenses/u,
      tab + ' contains license text',
    );
  }
  assert.ok(code.JS.includes('__INTERLESS_CHARACTER_PACK__'));
  assert.ok(!code.JS.includes(pack.characters.newdino.url));
  assert.ok(code.JS.includes('__INTERLESS_MEDIA_LIBRARY__'));
  assert.ok(!code.JS.includes('blob:'));
  assert.equal(JSON.parse(code.FIELDS).dinoMedia_newdino.type, 'image-input');
  assert.equal(JSON.parse(code.FIELDS).dinoCommand_newdino.value, '!боня');
  assert.equal(JSON.parse(code.FIELDS).chatScale.value, 125);
  assert.equal(JSON.parse(code.FIELDS).chatScale.type, 'slider');
  assert.equal(
    api
      .decodeProject(api.encodeProject({ chatScale: 125 }, api.getCharacterPack()))
      .preset.includes('125'),
    true,
  );
  assert.equal((code.CSS.match(/@font-face/gu) ?? []).length, 1);
  assert.ok(/font-family:(?:"Tiny5"|'Tiny5'|Tiny5)/u.test(code.CSS));
  assert.ok(code.CSS.includes('woff2'));
  assert.ok(!code.CSS.includes('data:font/ttf'));
  assert.ok(code.CSS.length < 130000);
  // A denied clipboard must select exactly the same code for manual Ctrl+C.
  clipboardFails = true;
  await dom.window.document.getElementById('copy-js').onclick();
  const fallback = dom.window.document.getElementById('copy-fallback');
  const manual = dom.window.document.getElementById('copy-code');
  assert.equal(fallback.hidden, false);
  assert.equal(manual.value, code.JS);
  assert.equal(manual.selectionStart, 0);
  assert.equal(manual.selectionEnd, code.JS.length);
  // Changing appearance invalidates visible fallback code; the next copy is fresh.
  dom.window.applyImportedPreset(api.encodePreset({ fontSize: 26 }));
  assert.equal(fallback.hidden, true);
  assert.equal(manual.value, '');
  clipboardFails = false;
  await dom.window.document.getElementById('copy-js').onclick();
  assert.ok(clipboardText.includes('26'));
  const latestPreset = JSON.parse(/__INTERLESS_WIDGET_PRESET__ = (.+);/u.exec(clipboardText)[1]);
  assert.equal(api.decodePreset(latestPreset).fontSize, 26);
  Object.defineProperty(dom.window.navigator, 'clipboard', {
    configurable: true,
    value: undefined,
  });
  await dom.window.document.getElementById('copy-html').onclick();
  assert.equal(fallback.hidden, false);
  assert.equal(manual.value, code.HTML);
  assert.equal(downloadCount, downloadsBeforeCopy);
  const widget =
    '<div id="root"></div><script>' + code.JS.replace(/<\/script/giu, '<\\/script') + '</script>';
  cold = new JSDOM(widget, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://widget.test/',
    virtualConsole: logs,
  });
  await sleep();
  assert.deepEqual(Object.keys(cold.window.InterlessChat.catalog), []);
  const remoteMedia = 'https://cdn.streamelements.com/uploads/test-image';
  cold.window.dispatchEvent(
    new cold.window.CustomEvent('onWidgetLoad', {
      detail: {
        fieldData: {
          fontSize: 10,
          settingsSource: 'fields',
          bubbleOpacity: 100,
          presetJson: api.encodePreset({ fontSize: 12 }),
          dinoMedia_newdino: remoteMedia,
          dinoCommand_newdino: '!Tyrex',
        },
      },
    }),
  );
  function send(id, text) {
    cold.window.dispatchEvent(
      new cold.window.CustomEvent('onEventReceived', {
        detail: {
          listener: 'message',
          event: {
            data: {
              time: Date.now(),
              nick: 'tester',
              userId: 'tester',
              displayName: 'Tester',
              text,
              emotes: [],
              badges: [],
              tags: {},
              msgId: id,
            },
          },
        },
      }),
    );
  }
  assert.equal(cold.window.InterlessChat.characterIdForCommand('!tyrex'), 'newdino');
  assert.equal(cold.window.InterlessChat.characterIdForCommand('!newdino'), undefined);
  assert.equal(cold.window.InterlessChat.characterIdForCommand('!боня'), undefined);
  send('choose', '!tyrex');
  send('text', 'Проверка переноса');
  await sleep();
  const row = cold.window.document.querySelector('article');
  assert.equal(row.dataset.characterId, 'newdino');
  assert.ok(row.querySelector('[data-packed-id="newdino"] img'));
  assert.equal(row.querySelector('[data-packed-id="newdino"] img').src, remoteMedia);
  assert.equal(cold.window.InterlessChat.catalog.newdino.name, 'Мой динозаврик');
  assert.equal(cold.window.document.querySelector('[data-chat-scale]').dataset.chatScale, '1.25');
  assert.equal(row.style.getPropertyValue('--font-size'), '24px');
  assert.equal(row.style.getPropertyValue('--text-color'), '#112233');
  assert.equal(row.style.getPropertyValue('--character-size'), '180px');
  assert.equal(row.style.getPropertyValue('--font-family'), 'Tiny5');
  assert.equal(row.style.getPropertyValue('--badge-color'), '#abcdef');
  assert.match(row.style.getPropertyValue('--bubble-fill'), /0\.37/u);
  // Rename live in StreamElements: saved IDs and existing message media remain intact.
  cold.window.dispatchEvent(
    new cold.window.CustomEvent('onWidgetLoad', {
      detail: {
        fieldData: {
          dinoMedia_newdino: remoteMedia,
          dinoCommand_newdino: '!Барни',
          chatScale: 175,
          fontSize: 10,
        },
      },
    }),
  );
  send('renamed', '!барни');
  send('renamed-text', 'После переименования');
  await sleep();
  assert.equal(cold.window.InterlessChat.characterIdForCommand('!барни'), 'newdino');
  assert.equal(cold.window.InterlessChat.characterIdForCommand('!tyrex'), undefined);
  assert.ok(!cold.window.InterlessChat.dinosaurHelp().includes('!tyrex'));
  assert.ok(cold.window.InterlessChat.dinosaurHelp().includes('!барни'));
  assert.equal(cold.window.document.querySelector('[data-chat-scale]').dataset.chatScale, '1.75');
  assert.equal(row.style.getPropertyValue('--font-size'), '24px');
  assert.ok(
    [...cold.window.document.querySelectorAll('article')].every(
      (article) => article.dataset.characterId === 'newdino',
    ),
  );
  // CDN URLs need not end with .webm: the exported media type chooses the video element.
  cold.window.__INTERLESS_MEDIA_LIBRARY__.characters.newdino.mediaType = 'video';
  cold.window.dispatchEvent(
    new cold.window.CustomEvent('onWidgetLoad', {
      detail: {
        fieldData: { dinoMedia_newdino: 'https://cdn.streamelements.com/uploads/test-video' },
      },
    }),
  );
  await sleep();
  const video = cold.window.document.querySelector('article video');
  assert.ok(video);
  assert.equal(video.src, 'https://cdn.streamelements.com/uploads/test-video');
  assert.ok(video.loop && video.muted && video.autoplay && video.playsInline);
  // Media changes are live native field updates, independent of frozen appearance.
  cold.window.dispatchEvent(
    new cold.window.CustomEvent('onWidgetLoad', {
      detail: { fieldData: { dinoMedia_newdino: '' } },
    }),
  );
  await sleep();
  assert.deepEqual(Object.keys(cold.window.InterlessChat.catalog), []);
  assert.equal(cold.window.document.querySelectorAll('article img, article video').length, 0);
  dom.window.document.getElementById('dino-pack-reset').click();
  await sleep();
  assert.deepEqual(Object.keys(api.catalog), []);
  assert.equal(dom.window.document.querySelectorAll('article img, article video').length, 0);
  assert.equal(dom.window.document.getElementById('random-dinosaurs').disabled, true);
  assert.match(
    dom.window.document.getElementById('dino-pack-status').textContent,
    /Загруженные персонажи удалены/u,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Clipboard transfer verified: all four tabs, denied/missing clipboard fallback, fresh settings, local project media, native media selection and clearing, no embedded animation and cold widget boot.',
  );
} finally {
  dom.window.close();
  cold?.window.close();
}
