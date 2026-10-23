import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config/defaults';
import { MessageLifecycleService } from '../src/lifecycle/MessageLifecycleService';
import { createActiveMessage, createChatMessage } from './fixtures';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MessageLifecycleService', () => {
  it('moves through visible, exiting, and removed states', () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    const service = new MessageLifecycleService(onStateChange);
    const active = createActiveMessage({
      message: createChatMessage({ createdAt: 0 }),
      lifecycle: 'entering',
    });

    service.sync([active], DEFAULT_CONFIG, 0);
    vi.advanceTimersByTime(DEFAULT_CONFIG.animation.enterDurationMs);
    expect(onStateChange).toHaveBeenCalledWith('message-1', 'visible');
    vi.advanceTimersByTime(
      DEFAULT_CONFIG.general.displayTimeMs - DEFAULT_CONFIG.animation.enterDurationMs,
    );
    expect(onStateChange).toHaveBeenCalledWith('message-1', 'exiting');
    vi.advanceTimersByTime(DEFAULT_CONFIG.animation.exitDurationMs);
    expect(onStateChange).toHaveBeenCalledWith('message-1', 'removed');
  });

  it('cancels timers for removed messages and on dispose', () => {
    vi.useFakeTimers();
    const service = new MessageLifecycleService(vi.fn());
    service.sync([createActiveMessage()], DEFAULT_CONFIG, 1_000);
    expect(vi.getTimerCount()).toBe(3);
    service.sync([], DEFAULT_CONFIG, 1_000);
    expect(vi.getTimerCount()).toBe(0);
    service.sync([createActiveMessage()], DEFAULT_CONFIG, 1_000);
    service.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('invokes platform timers with the global receiver', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(function (
      this: typeof globalThis,
    ) {
      expect(this).toBe(globalThis);
      return 1;
    });
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(function (
      this: typeof globalThis,
    ) {
      expect(this).toBe(globalThis);
    });
    const service = new MessageLifecycleService(vi.fn());

    service.sync([createActiveMessage()], DEFAULT_CONFIG, 1_000);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(3);

    service.dispose();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
  });
});
