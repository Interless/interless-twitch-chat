import { normalizeConfig } from '../../config/configNormalizer';
import { createMessageFragments, type EmoteSpan } from '../../domain/messageFragments';
import { resolveRole } from '../../domain/roleResolver';
import type { ChatBadge, ChatMessage, NormalizedWidgetEvent } from '../../domain/types';
import { installCharacterPack } from '../../domain/characterRegistry';
import { resolveMediaLibraryPack, type MediaLibraryManifest } from '../../domain/mediaLibrary';

type WidgetEventHandler = (event: NormalizedWidgetEvent) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function flagValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function safeTwitchMediaUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const allowedHosts = new Set(['static-cdn.jtvnw.net', 'cdn.jtvnw.net']);
    return url.protocol === 'https:' && allowedHosts.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function parseBadge(value: unknown): ChatBadge | null {
  if (!isRecord(value)) return null;
  const type = stringValue(value.type);
  if (type === null) return null;

  return {
    type,
    version: stringValue(value.version) ?? '1',
    url: safeTwitchMediaUrl(value.url),
    description: stringValue(value.description) ?? type,
  };
}

function parseBadges(data: Record<string, unknown>, tags: Record<string, unknown>): ChatBadge[] {
  const badges = Array.isArray(data.badges)
    ? data.badges.flatMap((badge) => {
        const parsed = parseBadge(badge);
        return parsed === null ? [] : [parsed];
      })
    : [];
  // Older widget payloads may omit a new Twitch badge from the image list.
  const known = new Set(badges.map((badge) => badge.type.toLowerCase()));
  for (const tag of (stringValue(tags.badges) ?? '').split(',')) {
    const [type, version] = tag.split('/');
    if (!type || known.has(type.toLowerCase())) continue;
    badges.push({ type, version: version ?? '1', url: null, description: type });
    known.add(type.toLowerCase());
  }
  return badges;
}

function parseEmotes(value: unknown): EmoteSpan[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((emote) => {
    if (!isRecord(emote) || !isRecord(emote.urls)) return [];
    const id = stringValue(emote.id);
    const name = stringValue(emote.name);
    const start = numberValue(emote.start);
    const end = numberValue(emote.end);
    const url =
      safeTwitchMediaUrl(emote.urls['4']) ??
      safeTwitchMediaUrl(emote.urls['2']) ??
      safeTwitchMediaUrl(emote.urls['1']);

    return id === null || name === null || start === null || end === null || url === null
      ? []
      : [{ id, name, start, end, url }];
  });
}

export function normalizeChatMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null;
  const tags = isRecord(value.tags) ? value.tags : {};
  const id = stringValue(value.msgId) ?? stringValue(tags.id);
  const userId = stringValue(value.userId) ?? stringValue(tags['user-id']);
  const text = stringValue(value.text);
  const login = stringValue(value.nick);
  const displayName = stringValue(value.displayName) ?? stringValue(tags['display-name']) ?? login;

  if (id === null || userId === null || text === null || login === null || displayName === null) {
    return null;
  }

  const badges = parseBadges(value, tags);
  const displayColorCandidate = stringValue(value.displayColor) ?? stringValue(tags.color);
  const displayColor =
    displayColorCandidate !== null && /^#[\da-f]{6}$/i.test(displayColorCandidate)
      ? displayColorCandidate
      : null;

  return {
    id,
    user: {
      id: userId,
      login,
      displayName,
      displayColor,
      badges,
      role: resolveRole({
        badges,
        isModerator: flagValue(tags.mod),
        isSubscriber: flagValue(tags.subscriber),
      }),
    },
    text,
    fragments: createMessageFragments(text, parseEmotes(value.emotes)),
    createdAt: numberValue(value.time) ?? Date.now(),
    isAction: flagValue(value.isAction),
  };
}

function detailFrom(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || !isRecord(value.detail)) return null;
  return value.detail;
}

export function normalizeWidgetLoadEvent(value: unknown): NormalizedWidgetEvent | null {
  const detail = detailFrom(value);
  if (detail === null) return null;
  return { type: 'config-loaded', config: normalizeConfig(detail.fieldData) };
}

export function normalizeEventReceived(value: unknown): NormalizedWidgetEvent | null {
  const detail = detailFrom(value);
  if (detail === null) return null;
  const listener = stringValue(detail.listener);
  const event = isRecord(detail.event) ? detail.event : null;
  if (listener === null || event === null) return null;

  if (listener === 'message') {
    const message = normalizeChatMessage(event.data);
    return message === null ? null : { type: 'message-received', message };
  }

  if (listener === 'delete-message') {
    const data = isRecord(event.data) ? event.data : event;
    const messageId = stringValue(data.msgId);
    return messageId === null ? null : { type: 'message-deleted', messageId };
  }

  if (listener === 'delete-messages') {
    const data = isRecord(event.data) ? event.data : event;
    const userId = stringValue(data.userId);
    return userId === null ? null : { type: 'user-messages-deleted', userId };
  }

  return null;
}

export class StreamElementsAdapter {
  public constructor(private readonly eventTarget: EventTarget = window) {}

  public subscribe(handler: WidgetEventHandler): () => void {
    const onWidgetLoad: EventListener = (event) => {
      const manifest = (globalThis as { __INTERLESS_MEDIA_LIBRARY__?: MediaLibraryManifest | null })
        .__INTERLESS_MEDIA_LIBRARY__;
      if (manifest !== undefined)
        installCharacterPack(resolveMediaLibraryPack(manifest, detailFrom(event)?.fieldData));
      const normalized = normalizeWidgetLoadEvent(event);
      if (normalized !== null) handler(normalized);
    };
    const onEventReceived: EventListener = (event) => {
      const normalized = normalizeEventReceived(event);
      if (normalized !== null) handler(normalized);
    };

    // Internal control for the offline preview, independent of provider events.
    const onClear: EventListener = () => handler({ type: 'chat-cleared' });
    const onPreview: EventListener = (event) => {
      const detail = detailFrom(event);
      if (!detail || !Array.isArray(detail.characterIds)) return;
      if (detail.userId !== undefined && (typeof detail.userId !== 'string' || !detail.userId))
        return;
      handler({
        type: 'preview-characters-selected',
        characterIds: detail.characterIds
          .filter((id): id is string => typeof id === 'string')
          .slice(0, 64),
        ...(typeof detail.userId === 'string' ? { userId: detail.userId } : {}),
      });
    };
    this.eventTarget.addEventListener('interless:preview-characters', onPreview);

    this.eventTarget.addEventListener('interless:clear-chat', onClear);
    this.eventTarget.addEventListener('onWidgetLoad', onWidgetLoad);
    this.eventTarget.addEventListener('onEventReceived', onEventReceived);

    return () => {
      this.eventTarget.removeEventListener('interless:preview-characters', onPreview);
      this.eventTarget.removeEventListener('interless:clear-chat', onClear);
      this.eventTarget.removeEventListener('onWidgetLoad', onWidgetLoad);
      this.eventTarget.removeEventListener('onEventReceived', onEventReceived);
    };
  }
}
