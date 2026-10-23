import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults';
import { idleMotionFor } from '../src/domain/idleMotion';

describe('idle card movement', () => {
  it('uses stable, staggered timing per message without changing on re-render', () => {
    const one = idleMotionFor('message-one', DEFAULT_CONFIG.animation);
    const two = idleMotionFor('message-two', DEFAULT_CONFIG.animation);
    expect(idleMotionFor('message-one', DEFAULT_CONFIG.animation)).toEqual(one);
    expect([one.delayMs, one.durationMs]).not.toEqual([two.delayMs, two.durationMs]);
    expect(one.delayMs).toBeLessThanOrEqual(0);
    expect(one.delayMs).toBeGreaterThan(-one.durationMs);
  });
  it('moves faster with increased frequency and stops at zero frequency or strength', () => {
    const slow = idleMotionFor('same', { ...DEFAULT_CONFIG.animation, idleFrequency: 1 });
    const fast = idleMotionFor('same', { ...DEFAULT_CONFIG.animation, idleFrequency: 100 });
    expect(fast.durationMs).toBeLessThan(slow.durationMs);
    expect(idleMotionFor('same', { ...DEFAULT_CONFIG.animation, idleFrequency: 0 }).mode).toBe(
      'off',
    );
    expect(idleMotionFor('same', { ...DEFAULT_CONFIG.animation, idleIntensity: 0 }).mode).toBe(
      'off',
    );
    expect(idleMotionFor('same', { ...DEFAULT_CONFIG.animation, idleMotion: 'off' }).mode).toBe(
      'off',
    );
  });
  it('produces bounded integer pixel offsets, including fractional intensity settings', () => {
    for (const idleIntensity of [0.2, 0.7, 1, 2.4, 3]) {
      const motion = idleMotionFor('bounded', { ...DEFAULT_CONFIG.animation, idleIntensity });
      for (const offset of [motion.distance, motion.small, motion.half, motion.lateral]) {
        expect(Number.isInteger(offset)).toBe(true);
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(9);
      }
    }
  });
});
