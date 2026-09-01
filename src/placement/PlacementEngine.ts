import { intersectionArea, rectanglesOverlap, rotatedDimensions } from './collisionDetector';
import type { RandomSource } from './seededRandom';
import type { Dimensions, PlacementResult, Rectangle } from '../domain/types';

export interface PlacementRequest {
  scene: Dimensions;
  bubble: Dimensions;
  existing: Rectangle[];
  safeZones: Rectangle[];
  edgePadding: number;
  messageGap: number;
  maxAttempts: number;
  rotationMin: number;
  rotationMax: number;
  rotationOffset: number;
}

interface Candidate extends PlacementResult {
  score: number;
}

function toPlacementResult(candidate: Candidate, usedFallback: boolean): PlacementResult {
  return {
    x: candidate.x,
    y: candidate.y,
    rotation: candidate.rotation,
    collisionRect: candidate.collisionRect,
    attempts: candidate.attempts,
    usedFallback,
  };
}

function clampedRandom(random: RandomSource): number {
  return Math.min(1, Math.max(0, random()));
}

export class PlacementEngine {
  public constructor(private readonly random: RandomSource = Math.random) {}

  public place(request: PlacementRequest): PlacementResult {
    const attempts = Math.max(1, Math.floor(request.maxAttempts));
    let bestCandidate: Candidate | null = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const candidate = this.createCandidate(request, attempt);
      const obstacles = [...request.existing, ...request.safeZones];
      const hasCollision = obstacles.some((rectangle) =>
        rectanglesOverlap(candidate.collisionRect, rectangle, request.messageGap),
      );

      if (!hasCollision) return toPlacementResult(candidate, false);
      if (bestCandidate === null || candidate.score < bestCandidate.score) {
        bestCandidate = candidate;
      }
    }

    if (bestCandidate === null) {
      throw new Error('Placement engine could not create a fallback candidate');
    }

    return toPlacementResult(bestCandidate, true);
  }

  private createCandidate(request: PlacementRequest, attempt: number): Candidate {
    const rotationRange = Math.max(0, request.rotationMax - request.rotationMin);
    const rotation =
      request.rotationMin + clampedRandom(this.random) * rotationRange + request.rotationOffset;
    const collisionSize = rotatedDimensions(request.bubble.width, request.bubble.height, rotation);
    const availableWidth = Math.max(
      0,
      request.scene.width - request.edgePadding * 2 - collisionSize.width,
    );
    const availableHeight = Math.max(
      0,
      request.scene.height - request.edgePadding * 2 - collisionSize.height,
    );
    const collisionRect: Rectangle = {
      x: Math.min(
        Math.max(0, request.edgePadding),
        Math.max(0, request.scene.width - collisionSize.width),
      ),
      y: Math.min(
        Math.max(0, request.edgePadding),
        Math.max(0, request.scene.height - collisionSize.height),
      ),
      width: Math.min(collisionSize.width, request.scene.width),
      height: Math.min(collisionSize.height, request.scene.height),
    };
    collisionRect.x += clampedRandom(this.random) * availableWidth;
    collisionRect.y += clampedRandom(this.random) * availableHeight;

    const existingScore = request.existing.reduce(
      (score, rectangle) => score + intersectionArea(collisionRect, rectangle, request.messageGap),
      0,
    );
    const safeZoneScore = request.safeZones.reduce(
      (score, rectangle) =>
        score + intersectionArea(collisionRect, rectangle, request.messageGap) * 10,
      0,
    );

    return {
      x: collisionRect.x + (collisionRect.width - request.bubble.width) / 2,
      y: collisionRect.y + (collisionRect.height - request.bubble.height) / 2,
      rotation,
      collisionRect,
      attempts: attempt,
      usedFallback: false,
      score: existingScore + safeZoneScore,
    };
  }
}
