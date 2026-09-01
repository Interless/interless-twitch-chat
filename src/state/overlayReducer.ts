import { DEFAULT_CONFIG } from '../config/defaults';
import type {
  ActiveMessage,
  ChatMessage,
  MessageLifecycleState,
  PlacementResult,
  WidgetConfig,
} from '../domain/types';

export interface OverlayState {
  config: WidgetConfig;
  initialized: boolean;
  messages: ActiveMessage[];
}

export type OverlayAction =
  | { type: 'config-loaded'; config: WidgetConfig }
  | { type: 'message-received'; message: ChatMessage }
  | { type: 'set-lifecycle'; messageId: string; lifecycle: MessageLifecycleState }
  | { type: 'message-deleted'; messageId: string }
  | { type: 'user-messages-deleted'; userId: string }
  | { type: 'chat-cleared' }
  | { type: 'message-placed'; messageId: string; placement: PlacementResult }
  | { type: 'reset-placements' };

export const INITIAL_OVERLAY_STATE: OverlayState = {
  config: DEFAULT_CONFIG,
  initialized: false,
  messages: [],
};

function shouldSuppressMessage(message: ChatMessage, config: WidgetConfig): boolean {
  if (config.general.hideCommands && message.text.trimStart().startsWith('!')) return true;
  const login = message.user.login.toLowerCase();
  return config.general.ignoredUsers.includes(login);
}

function addMessage(state: OverlayState, message: ChatMessage): OverlayState {
  if (
    shouldSuppressMessage(message, state.config) ||
    state.messages.some((active) => active.message.id === message.id)
  ) {
    return state;
  }

  const nextMessage: ActiveMessage = { message, lifecycle: 'entering', placement: null };
  const messages = [...state.messages, nextMessage].slice(-state.config.general.maxMessages);
  return { ...state, messages };
}

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'config-loaded': {
      const messages = state.messages
        .filter((active) => !shouldSuppressMessage(active.message, action.config))
        .slice(-action.config.general.maxMessages)
        .map((active) => ({ ...active, placement: null }));
      return { config: action.config, initialized: true, messages };
    }
    case 'message-received':
      return addMessage(state, action.message);
    case 'set-lifecycle': {
      if (action.lifecycle === 'removed') {
        return {
          ...state,
          messages: state.messages.filter((active) => active.message.id !== action.messageId),
        };
      }
      return {
        ...state,
        messages: state.messages.map((active) =>
          active.message.id === action.messageId
            ? { ...active, lifecycle: action.lifecycle }
            : active,
        ),
      };
    }
    case 'message-deleted':
      return {
        ...state,
        messages: state.messages.filter((active) => active.message.id !== action.messageId),
      };
    case 'user-messages-deleted':
      return {
        ...state,
        messages: state.messages.filter((active) => active.message.user.id !== action.userId),
      };
    case 'chat-cleared':
      return { ...state, messages: [] };
    case 'message-placed':
      return {
        ...state,
        messages: state.messages.map((active) =>
          active.message.id === action.messageId
            ? { ...active, placement: action.placement }
            : active,
        ),
      };
    case 'reset-placements':
      return {
        ...state,
        messages: state.messages.map((active) => ({ ...active, placement: null })),
      };
  }
}
