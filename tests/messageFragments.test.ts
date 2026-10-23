import { describe, expect, it } from 'vitest';
import { createMessageFragments, type EmoteSpan } from '../src/domain/messageFragments';

const emote = {
  id: '25',
  name: 'Kappa',
  url: 'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0',
};
const reconstruct = (fragments: ReturnType<typeof createMessageFragments>) =>
  fragments.map((fragment) => (fragment.type === 'text' ? fragment.text : fragment.name)).join('');

describe('message emote ranges', () => {
  for (const count of [1, 4, 30, 80]) {
    for (const exclusive of [false, true]) {
      it(`keeps all ${String(count)} repeated emotes, including the final ${exclusive ? 'exclusive' : 'inclusive'} range`, () => {
        const text = Array.from({ length: count }, () => emote.name).join(' ');
        const spans = Array.from({ length: count }, (_, index) => ({
          ...emote,
          start: index * 6,
          end: index * 6 + (exclusive ? 5 : 4),
        }));
        const fragments = createMessageFragments(text, spans);
        expect(fragments.filter((fragment) => fragment.type === 'emote')).toHaveLength(count);
        expect(fragments.at(-1)?.type).toBe('emote');
        expect(reconstruct(fragments)).toBe(text);
      });
    }
  }
  for (const codePoints of [false, true]) {
    for (const exclusive of [false, true]) {
      it(`preserves emoji, Cyrillic and spacing with ${codePoints ? 'Unicode' : 'UTF-16'} ${exclusive ? 'exclusive' : 'inclusive'} offsets`, () => {
        // Six astral characters shift UTF-16 positions by one complete repeated token.
        const prefix = '😀'.repeat(6) + ' Привет  ';
        const text = prefix + 'Kappa Kappa Kappa!';
        const first = codePoints ? Array.from(prefix).length : prefix.length;
        const spans = Array.from({ length: 3 }, (_, index) => ({
          ...emote,
          start: first + index * 6,
          end: first + index * 6 + (exclusive ? 5 : 4),
        }));
        const fragments = createMessageFragments(text, spans);
        expect(fragments.filter((fragment) => fragment.type === 'emote')).toHaveLength(3);
        expect(fragments[0]).toEqual({ type: 'text', text: prefix });
        expect(fragments.at(-1)).toEqual({ type: 'text', text: '!' });
        expect(reconstruct(fragments)).toBe(text);
      });
    }
  }
  it('deduplicates overlapping positions without dropping adjacent text or distinct emotes', () => {
    const text = 'Kappa PogChamp Kappa!';
    const spans: EmoteSpan[] = [
      { ...emote, start: 15, end: 20 },
      { ...emote, start: 0, end: 4 },
      { ...emote, start: 0, end: 5 },
      { ...emote, id: '88', name: 'PogChamp', start: 6, end: 13 },
      { ...emote, start: -1, end: 4 },
      { ...emote, start: 100, end: 104 },
      { ...emote, start: 0.5, end: 4 },
    ];
    const fragments = createMessageFragments(text, spans);
    expect(
      fragments.filter((fragment) => fragment.type === 'emote').map((fragment) => fragment.name),
    ).toEqual(['Kappa', 'PogChamp', 'Kappa']);
    expect(reconstruct(fragments)).toBe(text);
  });
  it('leaves unverified names and out-of-range spans as ordinary text', () => {
    const text = '<script>Kappa</script>';
    expect(
      createMessageFragments(text, [
        { ...emote, start: 0, end: 4 },
        { ...emote, start: 8, end: 999 },
      ]),
    ).toEqual([{ type: 'text', text }]);
  });
});
