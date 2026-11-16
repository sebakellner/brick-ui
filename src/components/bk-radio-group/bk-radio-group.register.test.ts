import { expect } from '@open-wc/testing';
import '../../index.js';

describe('bk-radio-group registration', () => {
  it('should not register the element when the package entry is imported', () => {
    expect(customElements.get('bk-radio-group')).to.equal(undefined);
  });
});
