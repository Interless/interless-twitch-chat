import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserName } from '../src/components/UserName';
import { normalizeChatMessage } from '../src/adapters/streamelements/StreamElementsAdapter';
import { createChatMessage } from './fixtures';

describe('styled role badges', () => {
  it.each([
    ['', 'cockroach'],
    ['vip', 'diamond'],
    ['moderator', 'sword'],
    ['lead_moderator', 'hammer'],
    ['broadcaster', 'crown'],
    ['subscriber', 'cockroach'],
  ])('renders the appropriate styled icon from Twitch badge %s', (type, icon) => {
    const message = normalizeChatMessage({
      msgId: '1',
      userId: '1',
      nick: 'viewer',
      text: 'Привет',
      tags: { badges: type ? `${type}/1` : '' },
    });
    if (!message) throw new Error('Valid test message was rejected');
    const { container } = render(<UserName user={message.user} showBadges />);
    expect(container.querySelector('svg')).toHaveAttribute('data-badge', icon);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('strong')).toHaveTextContent('viewer');
  });
  it('respects hidden badges and replaces original authority badges without duplicates', () => {
    const user = {
      ...createChatMessage().user,
      role: 'moderator' as const,
      badges: [
        {
          type: 'moderator',
          version: '1',
          url: 'https://static-cdn.jtvnw.net/badges/v1/mod/1',
          description: 'Moderator',
        },
      ],
    };
    const { container, rerender } = render(<UserName user={user} showBadges />);
    expect(container.querySelectorAll('[data-badge]')).toHaveLength(1);
    expect(container.querySelector('img')).toBeNull();
    rerender(<UserName user={user} showBadges={false} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
