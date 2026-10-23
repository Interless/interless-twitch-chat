import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MessageBubble } from '../src/components/MessageBubble';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import { normalizeConfig } from '../src/config/configNormalizer';
import { installCharacterPack } from '../src/domain/characterRegistry';
import { TEST_CHARACTER_PACK } from './characterFixtures';
afterEach(() => installCharacterPack(null));
import { createActiveMessage, createChatMessage } from './fixtures';

describe('MessageBubble', () => {
  it('starts without a character or empty image and accepts a custom muted video', () => {
    const active = createActiveMessage();
    const { container, rerender } = render(
      <MessageBubble active={active} config={DEFAULT_CONFIG} />,
    );
    expect(container.querySelector('[data-packed]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();

    const config = structuredClone(DEFAULT_CONFIG);
    config.roleThemes[active.message.user.role].assets.characterUrl =
      'https://example.com/dinosaur.webm?version=2';
    rerender(<MessageBubble active={active} config={config} characterSide="left" />);
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', 'https://example.com/dinosaur.webm?version=2');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video?.muted).toBe(true);
    expect(container.querySelector('article')).toHaveAttribute('data-character-side', 'left');
    expect(container.querySelector('[data-packed="true"]')).toBeNull();
  });

  it('renders long Unicode and RTL-compatible content', () => {
    const text = `Привет 👋 مرحباً ${'verylongword'.repeat(30)}`;
    render(
      <MessageBubble
        active={createActiveMessage({
          message: createChatMessage({ text, fragments: [{ type: 'text', text }] }),
        })}
        config={DEFAULT_CONFIG}
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
      />,
    );
    expect(screen.getByRole('img', { name: 'Kappa' })).toHaveAttribute(
      'src',
      'https://static-cdn.jtvnw.net/emoticons/v1/25/2.0',
    );
  });
});

describe('personal character rendering', () => {
  it('uses the selected catalog asset before the role default and uses the uploaded frame on fallback', () => {
    installCharacterPack(TEST_CHARACTER_PACK);
    const config = normalizeConfig({});
    config.dinosaurs.dance = { name: 'Рекс', characterUrl: 'https://example.com/dance.webp' };
    const active = createActiveMessage({ characterId: 'dance' });
    const { container, rerender } = render(<MessageBubble active={active} config={config} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/dance.webp');
    expect(container.querySelector('[data-packed="true"]')).toBeNull();
    rerender(<MessageBubble active={{ ...active, characterId: 'alpha' }} config={config} />);
    expect(container.querySelector('[data-packed-id="alpha"] img')).toHaveAttribute(
      'src',
      TEST_CHARACTER_PACK.characters.alpha?.url,
    );
  });
});

describe('reference palette and transparent surfaces', () => {
  it('overrides only the selected elements across roles while preserving background alpha', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.appearance.customColors = {
      textColor: '#123456',
      badgeColor: '#ff8800',
      boneColor: '#22dd99',
    };
    config.appearance.bubbleOpacity = 0.5;
    for (const role of ['viewer', 'subscriber'] as const) {
      const active = createActiveMessage({
        message: createChatMessage({ user: { ...createChatMessage().user, role } }),
      });
      const { container, unmount } = render(<MessageBubble active={active} config={config} />);
      const article = container.querySelector('article');
      expect(article?.style.getPropertyValue('--text-color')).toBe('#123456');
      expect(article?.style.getPropertyValue('--badge-color')).toBe('#ff8800');
      expect(article?.style.getPropertyValue('--bubble-fill')).toBe(
        role === 'viewer' ? 'rgba(238, 228, 248, 0.5)' : 'rgba(75, 38, 120, 0.5)',
      );
      expect(decodeURIComponent(article?.style.getPropertyValue('--frame-image') ?? '')).toContain(
        'fill="#22dd99"',
      );
      expect(article?.style.getPropertyValue('--bubble-shadow')).toBe('none');
      expect(container.querySelector('[data-packed]')).toBeNull();
      unmount();
    }
  });

  it('uses dark subscriber/lead moderator cards and light moderator/viewer cards', () => {
    for (const role of ['subscriber', 'lead_moderator', 'moderator', 'viewer'] as const) {
      const active = createActiveMessage({
        message: createChatMessage({ user: { ...createChatMessage().user, role } }),
      });
      const { container, unmount } = render(
        <MessageBubble active={active} config={DEFAULT_CONFIG} />,
      );
      const expected = ['subscriber', 'lead_moderator'].includes(role)
        ? 'rgba(75, 38, 120, 1)'
        : 'rgba(238, 228, 248, 1)';
      expect(container.querySelector('article')?.style.getPropertyValue('--bubble-fill')).toBe(
        expected,
      );
      unmount();
    }
  });
  it('changes only background alpha, keeping text, frames and the character fully visible', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.appearance = { colorScheme: 'dark', bubbleOpacity: 0, headerOpacity: 0.5 };
    const { container } = render(<MessageBubble active={createActiveMessage()} config={config} />);
    const article = container.querySelector('article');
    expect(article?.style.getPropertyValue('--bubble-fill')).toBe('rgba(75, 38, 120, 0)');
    expect(article?.style.getPropertyValue('--header-fill')).toBe('rgba(75, 38, 120, 0.5)');
    expect(article?.style.getPropertyValue('--text-color')).toBe('#e5d3f7');
    expect(article?.style.getPropertyValue('--bubble-shadow')).toBe('none');
    expect(article?.style.opacity).toBe('');
    expect(container.querySelector('[data-packed]')).toBeNull();
  });
});

describe('alpha encoded in a custom theme color', () => {
  it('does not place an opaque shadow behind a partially transparent custom fill', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.roleThemes.viewer.bubbleColor = '#eee4f880';
    const { container } = render(<MessageBubble active={createActiveMessage()} config={config} />);
    const article = container.querySelector('article');
    expect(article?.style.getPropertyValue('--bubble-fill')).toBe('rgba(238, 228, 248, 0.501961)');
    expect(article?.style.getPropertyValue('--bubble-shadow')).toBe('none');
  });
});

describe('uploaded character switching', () => {
  it('switches between uploaded media and removes the character when the pack is cleared', () => {
    installCharacterPack(TEST_CHARACTER_PACK);
    const active = createActiveMessage({ characterId: 'alpha' });
    const { container, rerender } = render(
      <MessageBubble active={active} config={normalizeConfig({})} />,
    );
    expect(container.querySelector('[data-packed-id="alpha"] img')).toHaveAttribute(
      'src',
      TEST_CHARACTER_PACK.characters.alpha?.url,
    );
    rerender(
      <MessageBubble active={{ ...active, characterId: 'beta' }} config={normalizeConfig({})} />,
    );
    expect(container.querySelector('[data-packed-id="beta"] img')).toHaveAttribute(
      'src',
      TEST_CHARACTER_PACK.characters.beta?.url,
    );
    installCharacterPack(null);
    rerender(<MessageBubble active={active} config={normalizeConfig({})} />);
    expect(container.querySelector('[data-packed]')).toBeNull();
    expect(container.querySelector('img, video')).toBeNull();
    expect(container.querySelector('article')).toHaveAttribute('data-has-character', 'false');
  });
});
