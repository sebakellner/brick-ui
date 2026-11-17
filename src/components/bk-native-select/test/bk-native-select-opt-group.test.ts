import { expect, fixture, html } from '@open-wc/testing';
import { expectRendered } from '../../../test/helpers/a11y.js';
import type { BkNativeSelectOptGroup } from '.././bk-native-select-opt-group.js';
import '.././define.js';

describe('bk-native-select-opt-group', () => {
  /* T16: an atom that paints nothing still has to say its render happened, or the suite
   * is asserting against a tree that may not exist. */
  it('should render the slot that holds its options', async () => {
    const el = await fixture<BkNativeSelectOptGroup>(html`
      <bk-native-select-opt-group label="Instant"></bk-native-select-opt-group>
    `);

    expectRendered(el, 'slot');
  });

  it('should hold its options and paint nothing itself', async () => {
    const el = await fixture<BkNativeSelectOptGroup>(html`
      <bk-native-select-opt-group label="Instant">
        <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
      </bk-native-select-opt-group>
    `);

    expect(
      el.querySelectorAll('bk-native-select-opt').length,
      'the options are its children',
    ).to.equal(1);
    expect(getComputedStyle(el).display, 'the group is not painted').to.equal('none');
  });

  it('should reflect label and disabled, so a programmatic change is observable', async () => {
    const el = await fixture<BkNativeSelectOptGroup>(html`
      <bk-native-select-opt-group label="Instant"></bk-native-select-opt-group>
    `);

    el.label = 'Quiet';
    el.disabled = true;
    await el.updateComplete;

    expect(el.getAttribute('label'), 'label reflects').to.equal('Quiet');
    expect(el.hasAttribute('disabled'), 'disabled reflects').to.equal(true);
  });
});
