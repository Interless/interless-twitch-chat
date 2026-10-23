import { characterIdForCommand, isHelpCommand } from '../domain/chatCommands';
import { DEFAULT_CONFIG } from '../config/defaults';
import type {
  ActiveMessage,
  ChatMessage,
  MessageLifecycleState,
  WidgetConfig,
} from '../domain/types';

export interface OverlayState {
  config: WidgetConfig;
  initialized: boolean;
  messages: ActiveMessage[];
  nextSide: 'left' | 'right';
  userCharacters: Record<string, string>;
}

export type OverlayAction =
  | { type: 'preview-characters-selected'; characterIds: string[]; userId?: string }
  | { type: 'config-loaded'; config: WidgetConfig }
  | { type: 'message-received'; message: ChatMessage }
  | { type: 'set-lifecycle'; messageId: string; lifecycle: MessageLifecycleState }
  | { type: 'message-deleted'; messageId: string }
  | { type: 'user-messages-deleted'; userId: string }
  | { type: 'chat-cleared' };

export const INITIAL_OVERLAY_STATE: OverlayState = {
  config: DEFAULT_CONFIG,
  initialized: false,
  messages: [],
  nextSide: 'left',
  userCharacters: {},
};

function shouldSuppressMessage(message: ChatMessage, config: WidgetConfig): boolean {
  if (config.general.hideCommands && message.text.trimStart().startsWith('!')) return true;
  const login = message.user.login.toLowerCase();
  return config.general.ignoredUsers.includes(login);
}

function addMessage(state: OverlayState, message: ChatMessage): OverlayState {
  if (isHelpCommand(message.text)) return state;
  if (
    state.config.general.ignoredUsers.includes(message.user.login.toLowerCase()) ||
    state.messages.some((active) => active.message.id === message.id)
  )
    return state;

  // Commands select only the sender's character; chat text can never supply an asset URL.
  const characterId = characterIdForCommand(message.text, state.config.dinosaurs);
  if (characterId !== undefined && Object.hasOwn(state.config.dinosaurs, characterId)) {
    if (state.userCharacters[message.user.id] === characterId) return state;
    return {
      ...state,
      userCharacters: { ...state.userCharacters, [message.user.id]: characterId },
    };
  }
  if (shouldSuppressMessage(message, state.config)) return state;

  const selected = state.userCharacters[message.user.id];
  const login = message.user.login.toLowerCase();
  const assigned = Object.hasOwn(state.config.userDinosaurs, login)
    ? state.config.userDinosaurs[login]
    : undefined;
  const nextMessage: ActiveMessage = {
    message,
    lifecycle: 'entering',
    side: state.nextSide,
    characterId:
      selected !== undefined && Object.hasOwn(state.config.dinosaurs, selected)
        ? selected
        : (assigned ?? null),
  };
  const messages = [...state.messages, nextMessage].slice(-state.config.general.maxMessages);
  return { ...state, messages, nextSide: state.nextSide === 'left' ? 'right' : 'left' };
}

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'preview-characters-selected': {
      const pool = Array.from(new Set(action.characterIds)).filter((id) =>
        Object.hasOwn(state.config.dinosaurs, id),
      );
      const fallback = pool[0];
      if (fallback === undefined) return state;
      const users =
        action.userId === undefined
          ? Array.from(new Set(state.messages.map((a) => a.message.user.id)))
          : [action.userId];
      if (!users.length) return state;
      let offset = 0;
      for (let n = 0; n < pool.length; n++) {
        if (
          users.every(
            (id, i) =>
              pool[(i + n) % pool.length] !==
              (state.userCharacters[id] ??
                state.messages.find((a) => a.message.user.id === id)?.characterId ??
                null),
          )
        ) {
          offset = n;
          break;
        }
      }
      const selected = Object.fromEntries(
        users.map((id, i) => [id, pool[(i + offset) % pool.length] ?? fallback]),
      );
      return {
        ...state,
        userCharacters: { ...state.userCharacters, ...selected },
        messages: state.messages.map((a) =>
          Object.hasOwn(selected, a.message.user.id)
            ? { ...a, characterId: selected[a.message.user.id] ?? a.characterId }
            : a,
        ),
      };
    }

    case 'config-loaded': {
      const messages = state.messages
        .filter((active) => !shouldSuppressMessage(active.message, action.config))
        .slice(-action.config.general.maxMessages)
        .map((active) =>
          active.characterId !== null && !Object.hasOwn(action.config.dinosaurs, active.characterId)
            ? { ...active, characterId: null }
            : active,
        );
      const userCharacters = Object.fromEntries(
        Object.entries(state.userCharacters).filter(([, id]) =>
          Object.hasOwn(action.config.dinosaurs, id),
        ),
      );
      return { ...state, config: action.config, initialized: true, messages, userCharacters };
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
      return { ...state, messages: [], nextSide: 'left' };
  }
}
