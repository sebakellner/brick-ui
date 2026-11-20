import { expect } from '@open-wc/testing';

describe('browser environment', () => {
  it('should claim a hover-capable pointer, so the hover rules take part', () => {
    expect(
      matchMedia('(hover: hover)').matches,
      'no pointer device: `@media (hover: hover)` never matches here',
    ).to.equal(true);
  });
});
