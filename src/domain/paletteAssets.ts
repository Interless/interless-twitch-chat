import boneFrame from '../assets/bone-frame.svg?raw';
import boneDrips from '../assets/bone-drips.svg?raw';
import nameplateEdge from '../assets/nameplate-edge.svg?raw';
import type { CustomColors, PaletteKey } from './types';

const ASSETS = [
  ['--frame-image', boneFrame],
  ['--drips-image', boneDrips],
  ['--nameplate-image', nameplateEdge],
] as const;

const COLOR_KEYS: Record<string, PaletteKey> = {
  '#f5eaff': 'boneColor',
  '#eee3fa': 'boneColor',
  '#8d48c5': 'boneOutlineColor',
  '#9a59cf': 'boneOutlineColor',
  '#fffaff': 'boneHighlightColor',
  '#fff6ff': 'boneHighlightColor',
  '#d4b1ef': 'boneShadeColor',
  '#6b2b9f': 'frameShadowColor',
  '#ae70e2': 'frameColor',
  '#c297e7': 'accentColor',
  '#8c4bc0': 'accentShadeColor',
};

// Recolor vector decorations only; keep the supplied animated dinosaur files intact.
export function paletteAssets(colors: CustomColors): Record<`--${string}`, string> {
  if (Object.keys(colors).length === 0) return {};
  return Object.fromEntries(
    ASSETS.map(([property, source]) => {
      const svg = source.replace(/#[\da-f]{6}/giu, (color) => {
        const key = COLOR_KEYS[color.toLowerCase()];
        return key === undefined ? color : (colors[key] ?? color);
      });
      return [property, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`];
    }),
  );
}
