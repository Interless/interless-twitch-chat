import type { ActiveMessage, ChatMessage } from '../src/domain/types';

export function createChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const text = overrides.text ?? 'Hello chat';
  return {
    id: 'message-1',
    user: {
      id: 'user-1',
      login: 'viewer',
      displayName: 'Viewer',
      displayColor: '#abcdef',
      badges: [],
      role: 'viewer',
    },
    text,
    fragments: [{ type: 'text', text }],
    createdAt: 1_000,
    isAction: false,
    ...overrides,
  };
}

export function createActiveMessage(overrides: Partial<ActiveMessage> = {}): ActiveMessage {
  return {
    message: createChatMessage(),
    lifecycle: 'visible',
    side: 'left',
    characterId: null,
    ...overrides,
  };
}
