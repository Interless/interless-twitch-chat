export function selectedFontCss(css: string, requestedFont: unknown): string {
  const requested =
    typeof requestedFont === 'string' && requestedFont !== 'Interless Pixel'
      ? requestedFont
          .trim()
          .replace(/^['"]|['"]$/gu, '')
          .toLowerCase()
      : 'press start 2p';
  const family = requested || 'press start 2p';
  return css.replace(/@font-face\s*\{[^}]*\}/giu, (block) => {
    const match = /font-family\s*:\s*(?:"([^"]+)"|'([^']+)'|([^;}]+))/iu.exec(block);
    const declared = match?.[1] ?? match?.[2] ?? match?.[3];
    return declared?.trim().toLowerCase() === family ? block : '';
  });
}
