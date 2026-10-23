import type { EmoteFragment, MessageFragment } from './types';

export interface EmoteSpan {
  id: string;
  name: string;
  url: string;
  start: number;
  end: number;
}

export function createMessageFragments(text: string, emotes: EmoteSpan[]): MessageFragment[] {
  // Providers may count Unicode code points while JS slice uses UTF-16 code units.
  const codePointOffsets = [0];
  let offset = 0;
  for (const character of text) {
    offset += character.length;
    codePointOffsets.push(offset);
  }
  const candidates = emotes.filter(
    (emote) =>
      Number.isInteger(emote.start) &&
      Number.isInteger(emote.end) &&
      emote.start >= 0 &&
      emote.end >= emote.start &&
      emote.end <= text.length,
  );
  function normalizeRanges(offsets?: number[]): EmoteSpan[] {
    const ranges = candidates
      .flatMap((emote) => {
        const start = offsets ? offsets[emote.start] : emote.start;
        const ends = offsets
          ? [offsets[emote.end + 1], offsets[emote.end]]
          : [emote.end + 1, emote.end];
        // Check both inclusive/exclusive ends against the actual emote code.
        // Never consume adjacent text or a separator just to fit a supplied range.
        for (const end of ends) {
          if (
            start !== undefined &&
            end !== undefined &&
            end > start &&
            end <= text.length &&
            text.slice(start, end) === emote.name
          )
            return [{ ...emote, start, end }];
        }
        return [];
      })
      .sort((left, right) => left.start - right.start || left.end - right.end);
    let cursor = 0;
    return ranges.filter((emote) => {
      if (emote.start < cursor) return false;
      cursor = emote.end;
      return true;
    });
  }
  const utf16Ranges = normalizeRanges();
  const unicodeRanges =
    codePointOffsets.length === text.length + 1 ? [] : normalizeRanges(codePointOffsets);
  // Compare the whole message, not each occurrence: repeated names after emoji
  // can accidentally match an earlier occurrence under the wrong index convention.
  const validEmotes = unicodeRanges.length > utf16Ranges.length ? unicodeRanges : utf16Ranges;
  const fragments: MessageFragment[] = [];
  let cursor = 0;
  for (const emote of validEmotes) {
    if (emote.start > cursor) {
      fragments.push({ type: 'text', text: text.slice(cursor, emote.start) });
    }
    const fragment: EmoteFragment = {
      type: 'emote',
      id: emote.id,
      name: emote.name,
      url: emote.url,
    };
    fragments.push(fragment);
    cursor = emote.end;
  }
  if (cursor < text.length) fragments.push({ type: 'text', text: text.slice(cursor) });
  if (fragments.length === 0) fragments.push({ type: 'text', text });
  return fragments;
}
