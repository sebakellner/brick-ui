import { expect } from '@open-wc/testing';
import '../../index.js';

describe('bk-native-select registration', () => {
  it('should not register any of the three tags when the package entry is imported', () => {
    expect(customElements.get('bk-native-select')).to.equal(undefined);
    expect(customElements.get('bk-native-select-opt')).to.equal(undefined);
    expect(customElements.get('bk-native-select-opt-group')).to.equal(undefined);
  });

  it('should register the select and both atoms when the select is defined', async () => {
    await import('./define.js');

    expect(customElements.get('bk-native-select') === undefined).to.equal(false);
    expect(
      customElements.get('bk-native-select-opt') === undefined,
      'an atom whose tag nobody defined would stay inert',
    ).to.equal(false);
    expect(customElements.get('bk-native-select-opt-group') === undefined).to.equal(false);
  });
});
