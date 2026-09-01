import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageBubble } from '../src/components/MessageBubble';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import { createActiveMessage, createChatMessage } from './fixtures';

describe('MessageBubble', () => {
  it('renders long Unicode and RTL-compatible content', () => {
    const text = `Привет 👋 مرحباً ${'verylongword'.repeat(30)}`;
    render(
      <MessageBubble
        active={createActiveMessage({
          message: createChatMessage({ text, fragments: [{ type: 'text', text }] }),
        })}
        config={DEFAULT_CONFIG}
        onMeasure={vi.fn()}
      />,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText(text).closest('[dir="auto"]')).toBeInTheDocument();
  });

  it('does not execute or parse an XSS payload as HTML', () => {
    const payload = '<script>window.pwned=true</script><img src=x onerror=alert(1)>';
    const { container } = render(
      <MessageBubble
        active={createActiveMessage({
          message: createChatMessage({
            text: payload,
            fragments: [{ type: 'text', text: payload }],
          }),
        })}
        config={DEFAULT_CONFIG}
        onMeasure={vi.fn()}
      />,
    );
    expect(screen.getByText(payload)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it('renders a validated Twitch emote as an image', () => {
    render(
      <MessageBubble
        active={createActiveMessage({
          message: createChatMessage({
            text: 'Kappa',
            fragments: [
              {
                type: 'emote',
                id: '25',
                name: 'Kappa',
                url: 'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0',
              },
            ],
          }),
        })}
        config={DEFAULT_CONFIG}
        onMeasure={vi.fn()}
      />,
    );
    expect(screen.getByRole('img', { name: 'Kappa' })).toHaveAttribute(
      'src',
      'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0',
    );
  });
});
