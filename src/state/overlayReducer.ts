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
  characterSeed: number;
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
  characterSeed: 0,
};

// A session seed is supplied once at startup. The reducer stays deterministic,
// and saved per-user choices take priority over this initial random selection.
function initialCharacter(state: OverlayState, userId: string): string | null {
  const pool = Object.keys(state.config.dinosaurs).filter(
    (id) => typeof state.config.dinosaurs[id]?.characterUrl === 'string',
  );
  if (pool.length === 0) return null;
  let hash = state.characterSeed;
  for (const char of userId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return pool[(hash >>> 0) % pool.length] ?? null;
}

function characterForUser(state: OverlayState, message: ChatMessage): string | null {
  const selected = state.userCharacters[message.user.id];
  if (selected !== undefined && Object.hasOwn(state.config.dinosaurs, selected)) return selected;
  const assigned = state.config.userDinosaurs[message.user.login.toLowerCase()];
  return assigned !== undefined && Object.hasOwn(state.config.dinosaurs, assigned)
    ? assigned
    : initialCharacter(state, message.user.id);
}

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

  const selected = characterForUser(state, message);
  const nextMessage: ActiveMessage = {
    message,
    lifecycle: 'entering',
    side: state.nextSide,
    characterId: selected,
  };
  const messages = [...state.messages, nextMessage].slice(-state.config.general.maxMessages);
  return {
    ...state,
    messages,
    userCharacters:
      selected !== null &&
      state.userCharacters[message.user.id] !== selected &&
      !Object.hasOwn(state.config.userDinosaurs, message.user.login.toLowerCase())
        ? { ...state.userCharacters, [message.user.id]: selected }
        : state.userCharacters,
    nextSide: state.nextSide === 'left' ? 'right' : 'left',
  };
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
      const userCharacters = Object.fromEntries(
        Object.entries(state.userCharacters).filter(([, id]) =>
          Object.hasOwn(action.config.dinosaurs, id),
        ),
      );
      const updated = { ...state, config: action.config, userCharacters };
      const messages = state.messages
        .filter((active) => !shouldSuppressMessage(active.message, action.config))
        .slice(-action.config.general.maxMessages)
        .map((active) => {
          if (
            active.characterId !== null &&
            Object.hasOwn(action.config.dinosaurs, active.characterId)
          )
            return active;
          const characterId = characterForUser(updated, active.message);
          if (
            characterId !== null &&
            !Object.hasOwn(action.config.userDinosaurs, active.message.user.login.toLowerCase())
          )
            userCharacters[active.message.user.id] = characterId;
          return { ...active, characterId };
        });
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
