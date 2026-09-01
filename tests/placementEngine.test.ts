import { describe, expect, it } from 'vitest';

import { rectanglesOverlap } from '../src/placement/collisionDetector';
import { PlacementEngine, type PlacementRequest } from '../src/placement/PlacementEngine';
import { createSeededRandom } from '../src/placement/seededRandom';

const BASE_REQUEST: PlacementRequest = {
  scene: { width: 800, height: 600 },
  bubble: { width: 220, height: 100 },
  existing: [],
  safeZones: [],
  edgePadding: 20,
  messageGap: 10,
  maxAttempts: 40,
  rotationMin: -3,
  rotationMax: 3,
  rotationOffset: 0,
};

describe('PlacementEngine', () => {
  it('is deterministic when a seeded random source is injected', () => {
    const first = new PlacementEngine(createSeededRandom(42)).place(BASE_REQUEST);
    const second = new PlacementEngine(createSeededRandom(42)).place(BASE_REQUEST);
    expect(first).toEqual(second);
  });

  it('keeps the collision box inside the scene bounds', () => {
    const placement = new PlacementEngine(createSeededRandom(7)).place(BASE_REQUEST);
    expect(placement.collisionRect.x).toBeGreaterThanOrEqual(BASE_REQUEST.edgePadding);
    expect(placement.collisionRect.y).toBeGreaterThanOrEqual(BASE_REQUEST.edgePadding);
    expect(placement.collisionRect.x + placement.collisionRect.width).toBeLessThanOrEqual(
      BASE_REQUEST.scene.width - BASE_REQUEST.edgePadding,
    );
    expect(placement.collisionRect.y + placement.collisionRect.height).toBeLessThanOrEqual(
      BASE_REQUEST.scene.height - BASE_REQUEST.edgePadding,
    );
  });

  it('avoids an existing message in a normal scenario', () => {
    const engine = new PlacementEngine(createSeededRandom(123));
    const first = engine.place(BASE_REQUEST);
    const second = engine.place({ ...BASE_REQUEST, existing: [first.collisionRect] });
    expect(rectanglesOverlap(first.collisionRect, second.collisionRect, 10)).toBe(false);
    expect(second.usedFallback).toBe(false);
  });

  it('returns a bounded fallback after the configured number of attempts', () => {
    const placement = new PlacementEngine(createSeededRandom(1)).place({
      ...BASE_REQUEST,
      scene: { width: 260, height: 140 },
      safeZones: [{ x: 0, y: 0, width: 260, height: 140 }],
      maxAttempts: 3,
    });
    expect(placement.usedFallback).toBe(true);
    expect(placement.attempts).toBeGreaterThanOrEqual(1);
    expect(placement.attempts).toBeLessThanOrEqual(3);
  });
});
