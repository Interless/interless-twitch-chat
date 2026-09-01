import type { EmoteFragment, MessageFragment } from './types';

export interface EmoteSpan {
  id: string;
  name: string;
  url: string;
  start: number;
  end: number;
}

export function createMessageFragments(text: string, emotes: EmoteSpan[]): MessageFragment[] {
  const validEmotes = emotes
    .filter(
      (emote) =>
        Number.isInteger(emote.start) &&
        Number.isInteger(emote.end) &&
        emote.start >= 0 &&
        emote.end >= emote.start &&
        emote.end < text.length,
    )
    .sort((left, right) => left.start - right.start || left.end - right.end);

  const fragments: MessageFragment[] = [];
  let cursor = 0;

  for (const emote of validEmotes) {
    if (emote.start < cursor) continue;
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
    cursor = emote.end + 1;
  }

  if (cursor < text.length) fragments.push({ type: 'text', text: text.slice(cursor) });
  if (fragments.length === 0) fragments.push({ type: 'text', text });

  return fragments;
}
