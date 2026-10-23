import { describe, expect, it } from 'vitest';
import { selectedFontCss } from '../src/preview/selectedFontCss';

const css =
  '@font-face{font-family:"Press Start 2P";src:url(data:font/woff2;base64,AAAA)}' +
  "@font-face{font-family:'Tiny5';src:url(data:font/woff2;base64,BBBB)}" +
  '@font-face{font-family:PT Sans;src:url(data:font/woff2;base64,CCCC)}' +
  '.bubble{color:red}';

describe('selected font only', () => {
  it('retains exactly the chosen face and all widget styles', () => {
    const result = selectedFontCss(css, 'Tiny5');
    expect(result.match(/@font-face/gu)).toHaveLength(1);
    expect(result).toContain('BBBB');
    expect(result).not.toContain('AAAA');
    expect(result).not.toContain('CCCC');
    expect(result).toContain('.bubble{color:red}');
  });
  it('uses the default font when no font is selected, and supports system fonts', () => {
    expect(selectedFontCss(css, undefined)).toContain('AAAA');
    expect(selectedFontCss(css, '   ')).toContain('AAAA');
    expect(selectedFontCss(css, 'Interless Pixel')).toContain('AAAA');
    expect(selectedFontCss(css, 'Arial')).toBe('.bubble{color:red}');
    expect(selectedFontCss(css, 'PT Sans')).toContain('CCCC');
  });
});
