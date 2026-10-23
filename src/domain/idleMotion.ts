import type { AnimationConfig } from './types';

/** Stable per-message timing avoids synchronized rows and render-time randomness. */
export function idleMotionFor(messageId: string, config: AnimationConfig) {
  let seed = 2166136261;
  for (const char of messageId) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  seed >>>= 0;
  const distance = Math.round(config.idleIntensity * 3);
  const durationMs = Math.round((22_000 - config.idleFrequency * 184) * (0.9 + (seed % 21) / 100));
  return {
    mode: config.idleFrequency === 0 || distance === 0 ? 'off' : config.idleMotion,
    distance,
    small: Math.round(distance / 3),
    half: Math.round(distance / 2),
    lateral: Math.min(2, Math.round(distance / 3)),
    durationMs,
    delayMs: -Math.round((durationMs * ((seed >>> 8) % 1000)) / 1000),
    direction: seed % 2 === 0 ? 'normal' : 'reverse',
  };
}
