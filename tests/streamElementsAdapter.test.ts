import { describe, expect, it } from 'vitest';

import {
  normalizeChatMessage,
  normalizeEventReceived,
} from '../src/adapters/streamelements/StreamElementsAdapter';

function incomingMessage(text = 'Test Kappa test') {
  return {
    time: 1_552_400_352_142,
    tags: {
      badges: 'subscriber/12,vip/1',
      mod: '0',
      subscriber: '1',
      id: 'message-tag-id',
      'user-id': 'user-tag-id',
    },
    nick: 'sendername',
    userId: 'user-1',
    displayName: 'SenderName',
    displayColor: '#641FEF',
    badges: [{ type: 'vip', version: '1', url: 'https://static-cdn.jtvnw.net/badges/v1/id/3' }],
    text,
    emotes: [
      {
        type: 'twitch',
        name: 'Kappa',
        id: '25',
        urls: { '2': 'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0' },
        start: 5,
        end: 9,
      },
    ],
    msgId: 'message-1',
  };
}

describe('StreamElements event normalization', () => {
  it('parses the documented Twitch message shape and native emotes', () => {
    const message = normalizeChatMessage(incomingMessage());

    expect(message?.id).toBe('message-1');
    expect(message?.user.role).toBe('vip');
    expect(message?.fragments).toEqual([
      { type: 'text', text: 'Test ' },
      {
        type: 'emote',
        id: '25',
        name: 'Kappa',
        url: 'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0',
      },
      { type: 'text', text: ' test' },
    ]);
  });

  it('keeps an XSS payload as ordinary text', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const message = normalizeChatMessage({ ...incomingMessage(payload), emotes: [] });
    expect(message?.fragments).toEqual([{ type: 'text', text: payload }]);
  });

  it('normalizes both moderator deletion listeners and ignores unknown events', () => {
    expect(
      normalizeEventReceived({
        detail: { listener: 'delete-message', event: { msgId: 'message-1' } },
      }),
    ).toEqual({ type: 'message-deleted', messageId: 'message-1' });
    expect(
      normalizeEventReceived({
        detail: { listener: 'delete-messages', event: { userId: 'user-1' } },
      }),
    ).toEqual({ type: 'user-messages-deleted', userId: 'user-1' });
    expect(
      normalizeEventReceived({ detail: { listener: 'raid-latest', event: { amount: 100 } } }),
    ).toBeNull();
  });

  it('rejects malformed messages and non-Twitch media hosts', () => {
    expect(normalizeChatMessage({ text: 'missing identifiers' })).toBeNull();
    const message = normalizeChatMessage({
      ...incomingMessage(),
      emotes: [
        {
          name: 'Kappa',
          id: '25',
          urls: { '2': 'https://attacker.example/emote.png' },
          start: 5,
          end: 9,
        },
      ],
    });
    expect(message?.fragments).toEqual([{ type: 'text', text: 'Test Kappa test' }]);
  });
});
