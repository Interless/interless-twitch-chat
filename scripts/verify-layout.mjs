import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1, `${label}: ${a} != ${b}`);
let checked = 0;
try {
  await page.goto(pathToFileURL(resolve('dist/streamelements/preview.html')).href);
  await page.waitForSelector('article');
  await page.evaluate(async () => {
    await globalThis.document.fonts.ready;
  });
  for (const width of [320, 480, 960]) {
    await page.setViewportSize({ width, height: 1800 });
    for (const scale of [25, 50, 100, 200]) {
      for (const alignment of ['left', 'center', 'right']) {
        for (const hasCharacter of [false, true]) {
          const options = { width, scale, alignment, hasCharacter };
          await page.evaluate(({ scale, alignment, hasCharacter }) => {
            const { document, InterlessChat: api } = globalThis;
            document.querySelector('.preview-panel').style.display = 'none';
            api.installCharacterPack(
              hasCharacter
                ? {
                    version: 1,
                    characters: {
                      alpha: {
                        name: 'Alpha',
                        width: 1,
                        height: 1,
                        bounds: [0, 0, 1, 1],
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                      },
                      beta: {
                        name: 'Beta',
                        width: 1,
                        height: 1,
                        bounds: [0, 0, 1, 1],
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                      },
                    },
                  }
                : null,
            );
            globalThis.applyImportedPreset(
              api.encodePreset({
                horizontalOffset: hasCharacter ? 0 : 32,
                bottomOffset: 0,
                chatScale: scale,
                chatAlignment: alignment,
                idleMotion: 'off',
                enterAnimation: 'fade',
                enterDurationMs: 0,
                displayTimeSeconds: 600,
                decorationsEnabled: true,
                decorationDensity: 100,
                decorationFrequency: 0,
              }),
            );
            document.getElementById('clear').click();
            const texts = [
              'Я',
              'Ладно я пойду уже наверное. Встретимся уже через неделю на следующих выходных получается. Всем хорошего вечера и удачи',
              'https://example.com/' + 'длиннаястрокабезпробелов'.repeat(5),
            ];
            for (const [i, text] of texts.entries()) {
              globalThis.dispatchEvent(
                new CustomEvent('onEventReceived', {
                  detail: {
                    listener: 'message',
                    event: {
                      data: {
                        msgId: `layout-${i}`,
                        userId: `layout-user-${i}`,
                        nick: `layout-user-${i}`,
                        displayName: 'ДлинныйНикПроверка123456789',
                        text,
                        time: Date.now(),
                        badges: [],
                        tags: {},
                      },
                    },
                  },
                }),
              );
            }
          }, options);
          await page.waitForFunction(
            () => globalThis.document.querySelectorAll('article').length === 3,
          );
          const rows = await page.evaluate(() =>
            [...globalThis.document.querySelectorAll('article')].map((row) => {
              const content = row.querySelector('[dir="auto"]');
              const text = content.lastElementChild;
              const bubble = content.parentElement;
              const frame = bubble.firstElementChild;
              const rect = (node) => {
                const r = node.getBoundingClientRect();
                return {
                  left: r.left,
                  right: r.right,
                  top: r.top,
                  bottom: r.bottom,
                  width: r.width,
                };
              };
              const ranges = [];
              const walker = globalThis.document.createTreeWalker(text, 4);
              while (walker.nextNode()) {
                const node = walker.currentNode;
                let offset = 0;
                for (const character of node.textContent) {
                  if (!/\s/u.test(character)) {
                    const range = globalThis.document.createRange();
                    range.setStart(node, offset);
                    range.setEnd(node, offset + character.length);
                    for (const r of range.getClientRects())
                      ranges.push({ left: r.left, right: r.right });
                  }
                  offset += character.length;
                }
              }
              return {
                side: row.dataset.messageSide,
                content: rect(content),
                text: rect(text),
                bubble: rect(bubble),
                frame: rect(frame),
                glyphs: ranges,
                scrollWidth: content.scrollWidth,
                clientWidth: content.clientWidth,
              };
            }),
          );
          assert.deepEqual(
            rows.map((r) => r.side),
            ['left', 'right', 'left'],
          );
          assert.ok(
            rows.at(-1).frame.bottom <= 1801,
            'bottom frame is not clipped ' + JSON.stringify(options),
          );
          for (let i = 1; i < rows.length; i++)
            assert.ok(
              rows[i - 1].frame.bottom <= rows[i].frame.top,
              'neighboring frames do not overlap ' + JSON.stringify(options),
            );
          for (const r of rows) {
            const label = JSON.stringify(options);
            near(
              r.text.left - r.content.left,
              r.content.right - r.text.right,
              'equal text insets ' + label,
            );
            assert.ok(
              r.frame.left >= -1 && r.frame.right <= width + 1,
              'frame in viewport ' + label + ' ' + JSON.stringify(r),
            );
            assert.ok(r.scrollWidth <= r.clientWidth + 1, 'no content overflow ' + label);
            for (const glyph of r.glyphs)
              assert.ok(
                glyph.left >= r.text.left - 1 && glyph.right <= r.text.right + 1,
                'wrapped text stays in its area ' +
                  label +
                  JSON.stringify({ glyph, text: r.text, content: r.content }),
              );
            checked++;
          }
        }
      }
    }
  }
  // Sample the extreme idle motion phases: the bone frame extends beyond the card box.
  for (const scale of [100, 200]) {
    await page.setViewportSize({ width: 480, height: 900 });
    await page.evaluate((scale) => {
      const { document, InterlessChat: api } = globalThis;
      globalThis.applyImportedPreset(
        api.encodePreset({
          chatScale: scale,
          horizontalOffset: 0,
          bottomOffset: 0,
          messageGap: 0,
          idleMotion: 'chaotic',
          idleIntensity: 3,
          fontFamily: 'PT Sans',
        }),
      );
      document.getElementById('clear').click();
      for (let i = 0; i < 3; i++) {
        document.getElementById('message').value = 'Короткое сообщение';
        document.querySelector('button[type="submit"]').click();
      }
    }, scale);
    await page.waitForFunction(() => globalThis.document.querySelectorAll('article').length === 3);
    for (const phase of [0, 0.11, 0.29, 0.43, 0.66, 0.78, 0.91]) {
      const frames = await page.evaluate(
        (phase) =>
          [...globalThis.document.querySelectorAll('article [dir="auto"]')].map((content) => {
            const bubble = content.parentElement;
            for (const animation of bubble.getAnimations()) {
              animation.pause();
              animation.currentTime = Number(animation.effect.getTiming().duration) * phase;
            }
            const frame = bubble.firstElementChild.getBoundingClientRect();
            return { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom };
          }),
        phase,
      );
      for (const frame of frames)
        assert.ok(frame.left >= -1 && frame.right <= 481, 'animated horizontal bounds');
      assert.ok(frames.at(-1).bottom <= 901, 'animated bottom bounds');
      for (let i = 1; i < frames.length; i++)
        assert.ok(frames[i - 1].bottom <= frames[i].top, 'animated frame separation');
    }
  }
  // Exercise the complete lifetime control with browser timers, without waiting in real time.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.evaluate(() => {
    const { document } = globalThis;
    document.getElementById('preview-pinned').checked = false;
    const slider = document.getElementById('display-time');
    slider.value = '2';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('clear').click();
    document.getElementById('message').value = 'Проверка времени';
    document.querySelector('button[type="submit"]').click();
  });
  await page.clock.runFor(1800);
  assert.equal(await page.locator('article').count(), 1);
  await page.evaluate(() => {
    const slider = globalThis.document.getElementById('display-time');
    slider.value = '5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.clock.runFor(3100);
  assert.equal(await page.locator('article[data-lifecycle="visible"]').count(), 1);
  await page.clock.runFor(120);
  assert.equal(await page.locator('article[data-lifecycle="exiting"]').count(), 1);
  await page.clock.runFor(350);
  assert.equal(await page.locator('article').count(), 0);
  assert.deepEqual(errors, []);
  process.stdout.write(
    `Chromium layout verified: ${checked} cards, equal text insets, frames inside viewport, wrapping, 25–200% scale, characters on alternating sides, lifetime slider and fade-out.\n`,
  );
} finally {
  await browser.close();
}
