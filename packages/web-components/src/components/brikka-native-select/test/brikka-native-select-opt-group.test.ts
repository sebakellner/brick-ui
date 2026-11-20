import { expect, fixture, html } from '@open-wc/testing';
import { expectRendered } from '@brikka/test-utils/a11y.js';
import type { BrikkaNativeSelectOptGroup } from '.././brikka-native-select-opt-group.js';
import '.././define.js';

describe('brikka-native-select-opt-group', () => {
  /* T16: an atom that paints nothing still has to say its render happened, or the suite
   * is asserting against a tree that may not exist. */
  it('should render the slot that holds its options', async () => {
    const el = await fixture<BrikkaNativeSelectOptGroup>(html`
      <brikka-native-select-opt-group label="Instant">
        <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
      </brikka-native-select-opt-group>
    `);

    expectRendered(el, 'slot');
  });

  it('should hold its options and paint nothing itself', async () => {
    const el = await fixture<BrikkaNativeSelectOptGroup>(html`
      <brikka-native-select-opt-group label="Instant">
        <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
      </brikka-native-select-opt-group>
    `);

    expect(
      el.querySelectorAll('brikka-native-select-opt').length,
      'the options are its children',
    ).to.equal(1);
    expect(getComputedStyle(el).display, 'the group is not painted').to.equal('none');
  });

  it('should reflect label and disabled, so a programmatic change is observable', async () => {
    const el = await fixture<BrikkaNativeSelectOptGroup>(html`
      <brikka-native-select-opt-group label="Instant"></brikka-native-select-opt-group>
    `);

    el.label = 'Quiet';
    el.disabled = true;
    await el.updateComplete;

    expect(el.getAttribute('label'), 'label reflects').to.equal('Quiet');
    expect(el.hasAttribute('disabled'), 'disabled reflects').to.equal(true);
  });
});
