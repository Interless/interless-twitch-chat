import type { ActiveMessage, ChatMessage, PlacementResult } from '../src/domain/types';

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

export function createPlacement(): PlacementResult {
  return {
    x: 10,
    y: 20,
    rotation: 1,
    collisionRect: { x: 8, y: 18, width: 260, height: 100 },
    attempts: 1,
    usedFallback: false,
  };
}

export function createActiveMessage(overrides: Partial<ActiveMessage> = {}): ActiveMessage {
  return {
    message: createChatMessage(),
    lifecycle: 'visible',
    placement: createPlacement(),
    ...overrides,
  };
}
