import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageDecorations } from '../src/components/MessageDecorations';
import { DEFAULT_CONFIG } from '../src/config/defaults';

describe('measured background decorations', () => {
  let width = 240;
  let height = 74;
  const callbacks = new Set<() => void>();
  const disconnect = vi.fn();
  const config = { ...DEFAULT_CONFIG.decorations, density: 100, frequency: 0 };

  beforeEach(() => {
    width = 240;
    height = 74;
    callbacks.clear();
    disconnect.mockClear();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.add(callback);
        }
        observe() {
          /* Native observation is delivered by the test's resize helper. */
        }
        disconnect = disconnect;
      },
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  const resize = async () => {
    await act(async () => {
      for (const callback of callbacks) callback();
      await Promise.resolve();
    });
  };

  it('remeasures on resize and leaves a too-small message empty', async () => {
    const { container, unmount } = render(<MessageDecorations messageId="short" config={config} />);
    await resize();
    expect(container.querySelectorAll('[data-decoration]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-decoration]').length).toBeLessThanOrEqual(6);
    expect(container.querySelector('[data-decorations]')).toHaveAttribute('aria-hidden', 'true');
    width = 40;
    height = 40;
    await resize();
    expect(container.querySelectorAll('[data-decoration]')).toHaveLength(0);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('uses only enabled drawings and removes every drawing when the last switch is off', async () => {
    const { container, rerender } = render(
      <MessageDecorations messageId="book" config={{ ...config, icons: ['book'] }} />,
    );
    await resize();
    const icons = [...container.querySelectorAll('[data-decoration]')];
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every((node) => node.getAttribute('data-decoration') === 'book')).toBe(true);
    rerender(<MessageDecorations messageId="book" config={{ ...config, icons: [] }} />);
    expect(container.querySelectorAll('[data-decoration]')).toHaveLength(0);
  });

  it('replaces a pattern at the chosen interval and clears its timer on unmount', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { container, unmount } = render(
      <MessageDecorations messageId="changing" config={{ ...config, frequency: 100 }} />,
    );
    await resize();
    const layer = container.querySelector('[data-decorations]');
    expect(layer).toHaveAttribute('data-decoration-generation', '0');
    const oldIcon = container.querySelector('[data-decoration]');
    const animated = container.querySelector<HTMLElement>('[data-decoration-refresh]');
    expect(animated?.style.getPropertyValue('--decoration-hold')).toBe('2100ms');
    expect(animated).toHaveAttribute('data-decoration-refresh', 'running');
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(container.querySelector('[data-decoration]')).toBe(oldIcon);
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(layer).toHaveAttribute('data-decoration-generation', '1');
    expect(container.querySelector('[data-decoration]')).not.toBe(oldIcon);
    expect(container.querySelectorAll('[data-decoration]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-decoration]').length).toBeLessThanOrEqual(6);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
