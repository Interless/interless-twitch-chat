import type { DecorationConfig, DecorationKind } from './types';

// Unrestricted random positions and angles; accept a candidate only when its
// rotated bounds fit the card and leave a gutter around every existing drawing.
export const DECORATION_SIZE = 24;
const GAP = 12;
const INSET = 8;

export interface DecorationPlacement {
  id: number;
  kind: DecorationKind;
  x: number;
  y: number;
  rotation: number;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

export function decorationPeriod(frequency: number): number | null {
  return frequency <= 0 ? null : Math.round(30_000 - Math.min(100, frequency) * 270);
}

export function decorationsFor(
  messageId: string,
  width: number,
  height: number,
  config: DecorationConfig,
  generation = 0,
): DecorationPlacement[] {
  if (
    !config.enabled ||
    config.density <= 0 ||
    config.chance <= 0 ||
    config.icons.length === 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    hash(`${messageId}:chance`) % 10_000 >= config.chance * 100
  )
    return [];

  const availableWidth = width - 2 * INSET;
  const availableHeight = height - 2 * INSET;
  const largestExtent = DECORATION_SIZE * Math.SQRT2;
  if (availableWidth < largestExtent || availableHeight < largestExtent) return [];
  // Area limits the requested count; it never dictates where an icon goes.
  const capacity = Math.max(
    1,
    Math.floor((availableWidth * availableHeight) / (largestExtent + GAP) ** 2),
  );
  const target = Math.min(128, Math.ceil((capacity * Math.min(100, config.density)) / 100));
  let seed = hash(`${messageId}:${String(generation)}`);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4_294_967_296;
  };
  const placements: DecorationPlacement[] = [];
  const bounds: { left: number; top: number; right: number; bottom: number }[] = [];
  // Stop when the available gaps are full; never force in extra icons or shrink them.
  for (let attempt = 0; attempt < target * 160 && placements.length < target; attempt++) {
    const rotation = Math.floor(random() * 360) - 180;
    const radians = (rotation * Math.PI) / 180;
    const extent = DECORATION_SIZE * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)));
    const expansion = (extent - DECORATION_SIZE) / 2;
    const minX = Math.ceil(INSET + expansion);
    const minY = Math.ceil(INSET + expansion);
    const maxX = Math.floor(width - INSET - DECORATION_SIZE - expansion);
    const maxY = Math.floor(height - INSET - DECORATION_SIZE - expansion);
    if (maxX < minX || maxY < minY) continue;
    const x = minX + Math.floor(random() * (maxX - minX + 1));
    const y = minY + Math.floor(random() * (maxY - minY + 1));
    const box = {
      left: x - expansion,
      top: y - expansion,
      right: x + DECORATION_SIZE + expansion,
      bottom: y + DECORATION_SIZE + expansion,
    };
    if (
      bounds.some(
        (other) =>
          !(
            box.right + GAP <= other.left ||
            other.right + GAP <= box.left ||
            box.bottom + GAP <= other.top ||
            other.bottom + GAP <= box.top
          ),
      )
    )
      continue;
    bounds.push(box);
    placements.push({
      id: placements.length,
      kind: config.icons[Math.floor(random() * config.icons.length)] ?? 'bone',
      x,
      y,
      rotation,
    });
  }
  return placements;
}
