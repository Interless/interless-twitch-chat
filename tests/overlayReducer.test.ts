import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/config/configNormalizer';
import { INITIAL_OVERLAY_STATE, overlayReducer } from '../src/state/overlayReducer';
import { createChatMessage } from './fixtures';
import { installCharacterPack } from '../src/domain/characterRegistry';
import { TEST_CHARACTER_PACK } from './characterFixtures';
beforeEach(() => installCharacterPack(TEST_CHARACTER_PACK));
afterEach(() => installCharacterPack(null));

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

describe('alternating messages and personal dinosaurs', () => {
  it('assigns from the full catalog once per user and preserves the choice after eviction, clear and reload', () => {
    const config = normalizeConfig({ maxMessages: 30 });
    let state = overlayReducer(
      { ...INITIAL_OVERLAY_STATE, characterSeed: 123456 },
      { type: 'config-loaded', config },
    );
    for (let i = 0; i < 20; i++) {
      state = overlayReducer(state, {
        type: 'message-received',
        message: createChatMessage({
          id: `first-${String(i)}`,
          user: { ...createChatMessage().user, id: `viewer-${String(i)}` },
        }),
      });
    }
    expect(new Set(state.messages.map((a) => a.characterId))).toEqual(new Set(['alpha', 'beta']));
    const preferences = { ...state.userCharacters };
    expect(Object.keys(preferences)).toHaveLength(20);
    state = overlayReducer(state, { type: 'chat-cleared' });
    state = overlayReducer(
      { ...state, characterSeed: 99999, userCharacters: preferences },
      { type: 'config-loaded', config },
    );
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({
        id: 'returned',
        user: { ...createChatMessage().user, id: 'viewer-0' },
      }),
    });
    expect(state.messages[0]?.characterId).toBe(preferences['viewer-0']);
    expect(state.messages[0]?.side).toBe('left');
  });

  it('assigns existing preview authors when a pack is added and reassigns a removed choice', () => {
    installCharacterPack(null);
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({}),
    });
    state = overlayReducer(state, { type: 'message-received', message: createChatMessage() });
    expect(state.messages[0]?.characterId).toBeNull();
    installCharacterPack(TEST_CHARACTER_PACK);
    state = overlayReducer(state, { type: 'config-loaded', config: normalizeConfig({}) });
    const selected = state.messages[0]?.characterId;
    expect(['alpha', 'beta']).toContain(selected);
    expect(state.userCharacters['user-1']).toBe(selected);
    const alpha = TEST_CHARACTER_PACK.characters.alpha;
    if (!alpha) throw new Error('Missing test character');
    installCharacterPack({ version: 1, characters: { gamma: alpha } });
    state = overlayReducer(state, { type: 'config-loaded', config: normalizeConfig({}) });
    expect(state.messages[0]?.characterId).toBe('gamma');
    expect(state.userCharacters['user-1']).toBe('gamma');
    installCharacterPack(null);
    state = overlayReducer(state, { type: 'config-loaded', config: normalizeConfig({}) });
    expect(state.messages[0]?.characterId).toBeNull();
    expect(state.userCharacters).toEqual({});
  });

  it('alternates accepted messages and keeps sides through filtering, deletion and eviction', () => {
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({ maxMessages: 2 }),
    });
    const receive = (id: string, text = 'hello') => {
      state = overlayReducer(state, {
        type: 'message-received',
        message: createChatMessage({ id, text }),
      });
    };
    receive('one');
    receive('hidden', '!other');
    receive('one');
    receive('two');
    expect(state.messages.map(({ side }) => side)).toEqual(['left', 'right']);
    state = overlayReducer(state, { type: 'message-deleted', messageId: 'one' });
    receive('three');
    receive('four');
    expect(state.messages.map(({ message, side }) => [message.id, side])).toEqual([
      ['three', 'left'],
      ['four', 'right'],
    ]);
    state = overlayReducer(state, {
      type: 'set-lifecycle',
      messageId: 'three',
      lifecycle: 'removed',
    });
    receive('five');
    expect(state.messages.map(({ side }) => side)).toEqual(['right', 'left']);
  });

  it('consumes commands before the hideCommands filter, affects only future messages by the sender, and does not advance the side', () => {
    let state = overlayReducer(INITIAL_OVERLAY_STATE, {
      type: 'config-loaded',
      config: normalizeConfig({ hideCommands: false }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'old' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'command', text: '  !AlPhA  ' }),
    });
    expect(state.messages).toHaveLength(1);
    const initialChoice = state.messages[0]?.characterId;
    expect(['alpha', 'beta']).toContain(initialChoice);
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({ id: 'new' }),
    });
    state = overlayReducer(state, {
      type: 'message-received',
      message: createChatMessage({
        id: 'other',
        user: { ...createChatMessage().user, id: 'user-2' },
      }),
    });
    expect(state.messages.map(({ characterId }) => characterId).slice(0, 2)).toEqual([
      initialChoice,
      'alpha',
    ]);
    expect(['alpha', 'beta']).toContain(state.messages[2]?.characterId);
    expect(state.messages.map(({ side }) => side)).toEqual(['left', 'right', 'left']);
  });

  it('uses configured assignments, allows personal selection, and ignores commands from blocked users', () => {
    const config = normalizeConfig({
      dinosaurCatalog: '{"dance":{"name":"Рекс","url":"https://example.com/dance.webp"}}',
      userDinosaurs: '{"VIEWER":"dance"}',
      ignoredUsers: 'blocked',
    });
    let state = overlayReducer(INITIAL_OVERLAY_STATE, { type: 'config-loaded', config });
    const receive = (id: string, text = 'hello', login = 'viewer') => {
      state = overlayReducer(state, {
        type: 'message-received',
        message: createChatMessage({ id, text, user: { ...createChatMessage().user, login } }),
      });
    };
    receive('one');
    expect(state.messages[0]?.characterId).toBe('dance');
    receive('blocked', '!alpha', 'blocked');
    expect(state.userCharacters).toEqual({});
    receive('command', '!alpha');
    receive('two');
    expect(state.messages[1]?.characterId).toBe('alpha');
    state = overlayReducer(state, { type: 'chat-cleared' });
    expect(state.userCharacters).toEqual({ 'user-1': 'alpha' });
    receive('three');
    expect(state.messages[0]).toMatchObject({ side: 'left', characterId: 'alpha' });
  });
});
