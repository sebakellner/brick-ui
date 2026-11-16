import { expect } from '@open-wc/testing';
import '../../index.js';

describe('bk-radio-group registration', () => {
  it('should not register either tag when the package entry is imported', () => {
    expect(customElements.get('bk-radio-group')).to.equal(undefined);
    expect(customElements.get('bk-radio-group-item')).to.equal(undefined);
  });

  it('should register both tags when the group is defined', async () => {
    await import('./define.js');

    expect(customElements.get('bk-radio-group') === undefined, 'the group is registered').to.equal(
      false,
    );
    expect(
      customElements.get('bk-radio-group-item') === undefined,
      'the private item is registered beside it, so a markup item is never inert',
    ).to.equal(false);
  });
});
