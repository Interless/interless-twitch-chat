import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import { DECORATION_SIZE, decorationPeriod, decorationsFor } from '../src/domain/decorations';

const full = { ...DEFAULT_CONFIG.decorations, density: 100, chance: 100 };

describe('non-overlapping message backgrounds', () => {
  it('caps short cards by actual space and never creates icons for a box that cannot fit one', () => {
    const short = decorationsFor('one-character', 206, 70, full);
    expect(short.length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(4);
    expect(decorationsFor('one-character', 206, 70, { ...full, density: 25 })).toHaveLength(1);
    for (const [width, height] of [
      [1, 70],
      [206, 1],
      [40, 40],
      [0, 0],
      [NaN, 100],
    ]) {
      expect(decorationsFor('one-character', width ?? 0, height ?? 0, full)).toEqual([]);
    }
    expect(decorationsFor('tall', 900, 30_000, full)).toHaveLength(128);
  });

  it('keeps rotated drawings inside the card and apart at maximum density across many sizes', () => {
    for (const width of [52, 70, 100, 160, 206, 260, 480]) {
      for (const height of [52, 70, 96, 200, 420]) {
        for (let generation = 0; generation < 8; generation++) {
          const icons = decorationsFor('safety', width, height, full, generation);
          const boxes = icons.map((icon) => {
            const radians = (icon.rotation * Math.PI) / 180;
            const extent =
              DECORATION_SIZE * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)));
            const left = icon.x + (DECORATION_SIZE - extent) / 2;
            const top = icon.y + (DECORATION_SIZE - extent) / 2;
            return { left, top, right: left + extent, bottom: top + extent };
          });
          for (const box of boxes) {
            expect(box.left).toBeGreaterThanOrEqual(8);
            expect(box.top).toBeGreaterThanOrEqual(8);
            expect(box.right).toBeLessThanOrEqual(width - 8);
            expect(box.bottom).toBeLessThanOrEqual(height - 8);
          }
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              if (!a || !b) continue;
              expect(
                a.right + 12 <= b.left ||
                  b.right + 12 <= a.left ||
                  a.bottom + 12 <= b.top ||
                  b.bottom + 12 <= a.top,
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it('scatters positions freely and uses a wide range of independent rotation angles', () => {
    const icons = decorationsFor('random-scatter', 1000, 1000, full);
    expect(icons.length).toBeGreaterThan(50);
    expect(new Set(icons.map((icon) => icon.rotation)).size).toBeGreaterThan(40);
    expect(new Set(icons.map((icon) => icon.x)).size).toBeGreaterThan(icons.length * 0.7);
    expect(new Set(icons.map((icon) => icon.y)).size).toBeGreaterThan(icons.length * 0.7);
    expect(icons.every((icon) => icon.rotation >= -180 && icon.rotation < 180)).toBe(true);
  });

  it('respects switches, zero values and message chance independently of density', () => {
    for (const config of [
      { ...full, enabled: false },
      { ...full, density: 0 },
      { ...full, chance: 0 },
      { ...full, icons: [] },
    ]) {
      expect(decorationsFor('message', 260, 500, config)).toEqual([]);
    }
    const books = decorationsFor('message', 260, 500, { ...full, icons: ['book'] });
    expect(books.length).toBeGreaterThan(0);
    expect(books.every((icon) => icon.kind === 'book')).toBe(true);
    let decorated = 0;
    for (let index = 0; index < 300; index++) {
      const id = String(index);
      const rare = decorationsFor(id, 206, 70, { ...full, chance: 25 });
      const common = decorationsFor(id, 206, 70, { ...full, chance: 75 });
      if (rare.length > 0) {
        decorated++;
        expect(common.length).toBeGreaterThan(0);
      }
    }
    expect(decorated).toBeGreaterThan(0);
    expect(decorated).toBeLessThan(300);
  });

  it('keeps a stable layout until refresh and can pause or accelerate refreshes', () => {
    const first = decorationsFor('message', 260, 500, full);
    expect(decorationsFor('message', 260, 500, full)).toEqual(first);
    expect(decorationsFor('message', 260, 500, full, 1)).not.toEqual(first);
    expect(decorationPeriod(0)).toBeNull();
    expect(decorationPeriod(100)).toBe(3000);
    expect(decorationPeriod(1)).toBeGreaterThan(decorationPeriod(80) ?? 0);
  });
});
