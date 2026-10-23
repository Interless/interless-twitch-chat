import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageLayer } from '../src/components/MessageLayer';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import { createActiveMessage, createChatMessage } from './fixtures';

describe('MessageLayer', () => {
  it('keeps chronological DOM order so the newest message is at the bottom', () => {
    render(
      <MessageLayer
        messages={[
          createActiveMessage({ message: createChatMessage({ id: 'old', text: 'Old message' }) }),
          createActiveMessage({ message: createChatMessage({ id: 'new', text: 'New message' }) }),
        ]}
        config={DEFAULT_CONFIG}
      />,
    );

    const articles = screen.getAllByRole('article');
    expect(articles.map((article) => article.dataset.messageId)).toEqual(['old', 'new']);
  });

  it('exposes the selected alignment and stack spacing as layout styles', () => {
    const config = {
      ...DEFAULT_CONFIG,
      layout: {
        ...DEFAULT_CONFIG.layout,
        scale: 1.5,
        alignment: 'right' as const,
        horizontalOffset: 48,
        bottomOffset: 64,
        messageGap: 12,
      },
    };

    const { container } = render(<MessageLayer messages={[]} config={config} />);
    const layer = container.firstElementChild;

    expect(layer).toHaveAttribute('data-alignment', 'right');
    expect(layer).toHaveAttribute('data-chat-scale', '1.5');
    expect(layer).toHaveStyle({
      alignItems: 'flex-end',
      '--chat-scale': '1.5',
      '--horizontal-offset': '48px',
      '--bottom-offset': '64px',
      '--message-gap': '12px',
    });
  });
});

describe('alternating layout', () => {
  it('keeps a compact left-anchored stack and alternates the bubble relative to the character', () => {
    const { container } = render(
      <MessageLayer
        config={DEFAULT_CONFIG}
        messages={[
          createActiveMessage({ side: 'left', message: createChatMessage({ id: 'one' }) }),
          createActiveMessage({ side: 'right', message: createChatMessage({ id: 'two' }) }),
        ]}
      />,
    );
    const [left, right] = container.querySelectorAll('article');
    expect(container.firstElementChild).toHaveStyle({ alignItems: 'flex-start' });
    expect(left?.style.alignSelf).toBe('');
    expect(left).toHaveAttribute('data-character-side', 'right');
    expect(right?.style.alignSelf).toBe('');
    expect(right).toHaveAttribute('data-character-side', 'left');
  });
});
