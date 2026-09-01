import { describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/config/configNormalizer';
import { INITIAL_OVERLAY_STATE, overlayReducer } from '../src/state/overlayReducer';
import { createChatMessage } from './fixtures';

describe('overlayReducer', () => {
  it('filters commands, ignored users, duplicates, and enforces the maximum', () => {
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({ maxMessages: 2, ignoredUsers: 'blocked', hideCommands: true }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'command', text: '!secret' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({
        id: 'blocked',
        user: { ...createChatMessage().user, login: 'Blocked' },
      }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'one' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'one' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'two' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'three' }),
    });

    expect(state.messages.map((active) => active.message.id)).toEqual(['two', 'three']);
  });

  it('handles lifecycle, single deletion, user purge, and chat clear', () => {
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'message-received',
      message: createChatMessage({ id: 'one' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({
        id: 'two',
        user: { ...createChatMessage().user, id: 'user-2' },
      }),
    });
    state = overlayReducer(state, {
      type: 'set-lifecycle',
      messageId: 'one',
      lifecycle: 'exiting',
    });
    expect(state.messages[0]?.lifecycle).toBe('exiting');
    state = overlayReducer(state, { type: 'message-deleted', messageId: 'one' });
    expect(state.messages).toHaveLength(1);
    state = overlayReducer(state, { type: 'user-messages-deleted', userId: 'user-2' });
    expect(state.messages).toHaveLength(0);

    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'three' }),
    });
    expect(overlayReducer(state, { type: 'chat-cleared' }).messages).toHaveLength(0);
  });
});
