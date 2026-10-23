import { describe, expect, it } from 'vitest';

import { ROLE_PRIORITY, resolveRole } from '../src/domain/roleResolver';
import type { ChatBadge } from '../src/domain/types';

function badges(...types: string[]): ChatBadge[] {
  return types.map((type) => ({ type, version: '1', url: null, description: type }));
}

describe('resolveRole', () => {
  it('documents the expected priority in one exported constant', () => {
    expect(ROLE_PRIORITY).toEqual([
      'broadcaster',
      'lead_moderator',
      'moderator',
      'vip',
      'subscriber',
      'viewer',
    ]);
  });

  it('selects the highest role when several badges are present', () => {
    expect(
      resolveRole({
        badges: badges('subscriber', 'vip', 'moderator', 'broadcaster'),
        isModerator: true,
        isSubscriber: true,
      }),
    ).toBe('broadcaster');
  });

  it('uses tag signals and falls back to viewer', () => {
    expect(resolveRole({ badges: [], isModerator: true, isSubscriber: true })).toBe('moderator');
    expect(resolveRole({ badges: [], isModerator: false, isSubscriber: false })).toBe('viewer');
  });
});

describe('lead moderator', () => {
  it('recognizes the Twitch lead_moderator badge even when the mod flag is absent and takes priority over other viewer roles', () => {
    expect(
      resolveRole({
        badges: badges('vip', 'subscriber', 'lead_moderator'),
        isModerator: false,
        isSubscriber: true,
      }),
    ).toBe('lead_moderator');
    expect(
      resolveRole({
        badges: badges('lead_moderator', 'broadcaster'),
        isModerator: true,
        isSubscriber: false,
      }),
    ).toBe('broadcaster');
  });
});
