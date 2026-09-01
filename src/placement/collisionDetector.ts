import type { Rectangle } from '../domain/types';

export function rectanglesOverlap(left: Rectangle, right: Rectangle, gap = 0): boolean {
  return (
    left.x < right.x + right.width + gap &&
    left.x + left.width + gap > right.x &&
    left.y < right.y + right.height + gap &&
    left.y + left.height + gap > right.y
  );
}

export function intersectionArea(left: Rectangle, right: Rectangle, gap = 0): number {
  const width = Math.max(
    0,
    Math.min(left.x + left.width + gap, right.x + right.width + gap) - Math.max(left.x, right.x),
  );
  const height = Math.max(
    0,
    Math.min(left.y + left.height + gap, right.y + right.height + gap) - Math.max(left.y, right.y),
  );
  return width * height;
}

export function rotatedDimensions(width: number, height: number, degrees: number) {
  const radians = (Math.abs(degrees) * Math.PI) / 180;
  return {
    width: Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)),
    height: Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)),
  };
}
