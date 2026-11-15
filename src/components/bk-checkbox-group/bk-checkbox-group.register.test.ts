import { expect } from '@open-wc/testing';
import '../../index.js';

describe('bk-checkbox-group registration', () => {
  it('should not register the element when the package entry is imported', () => {
    expect(customElements.get('bk-checkbox-group')).to.equal(undefined);
  });
});
