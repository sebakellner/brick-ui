import { expect } from '@open-wc/testing';
import '../../index.js';

const TAGS = ['bk-checkbox-group'] as const;

describe('bk-checkbox-group registration', () => {
  it('should register none of its tags when the package entry is imported', () => {
    for (const tag of TAGS) {
      expect(customElements.get(tag), tag).to.equal(undefined);
    }
  });

  it('should register all of them when its define module is imported', async () => {
    await import('./define.js');

    for (const tag of TAGS) {
      expect(customElements.get(tag) === undefined, tag).to.equal(false);
    }
  });
});
