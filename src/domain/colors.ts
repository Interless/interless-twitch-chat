/** Multiply a validated #RRGGBB[AA] color by the surface opacity. */
export function colorWithOpacity(color: string, opacity: number): string {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  const originalAlpha = color.length === 9 ? Number.parseInt(color.slice(7, 9), 16) / 255 : 1;
  const alpha = Math.round(originalAlpha * opacity * 1_000_000) / 1_000_000;
  return `rgba(${channels.join(', ')}, ${String(alpha)})`;
}
