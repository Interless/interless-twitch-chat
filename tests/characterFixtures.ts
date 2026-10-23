import type { CharacterPack } from '../src/domain/characterPack';

// Tiny generic media used only by tests; never imported by the widget.
export const TEST_CHARACTER_PACK: CharacterPack = {
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
};
