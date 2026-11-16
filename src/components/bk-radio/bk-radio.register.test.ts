import { expect } from '@open-wc/testing';
import '../../index.js';

describe('bk-radio registration', () => {
  it('should not register the element when the package entry is imported', () => {
    expect(customElements.get('bk-radio')).to.equal(undefined);
  });
});
