import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadCharacterPreferences,
  preferenceKey,
  saveCharacterPreferences,
} from '../src/persistence/characterPreferences';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('character preferences', () => {
  it('restores user choices after a reload and scopes them to the widget URL', () => {
    saveCharacterPreferences({ '123': 'skel' });
    expect(loadCharacterPreferences()).toEqual({ '123': 'skel' });
    expect(preferenceKey({ pathname: '/widget/one', search: '' })).not.toBe(
      preferenceKey({ pathname: '/widget/two', search: '' }),
    );
  });
  it('rejects malformed and invalid stored choices and tolerates blocked storage', () => {
    const key = preferenceKey(window.location);
    localStorage.setItem(key, '{broken');
    expect(loadCharacterPreferences()).toEqual({});
    localStorage.setItem(key, '{"123":"skel","456":"https://evil.example/dino.png","789":5}');
    expect(loadCharacterPreferences()).toEqual({ '123': 'skel' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    expect(() => saveCharacterPreferences({ '123': 'skel' })).not.toThrow();
  });
});
