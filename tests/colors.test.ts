import { describe, expect, it } from 'vitest';
import { colorWithOpacity } from '../src/domain/colors';

describe('surface alpha', () => {
  it('keeps RGB intact and combines configured transparency with any existing color alpha', () => {
    expect(colorWithOpacity('#eee4f8', 0)).toBe('rgba(238, 228, 248, 0)');
    expect(colorWithOpacity('#eee4f8', 0.7)).toBe('rgba(238, 228, 248, 0.7)');
    expect(colorWithOpacity('#ffffff80', 0.5)).toBe('rgba(255, 255, 255, 0.25098)');
  });
});
