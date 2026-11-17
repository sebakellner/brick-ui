import { expect, fixture, html } from '@open-wc/testing';
import { expectRendered } from '../../../test/helpers/a11y.js';
import type { BkNativeSelectOpt } from '.././bk-native-select-opt.js';
import '.././define.js';

const atom = (markup = 'Email') =>
  fixture<BkNativeSelectOpt>(
    html`<bk-native-select-opt value="email">${markup}</bk-native-select-opt>`,
  );

describe('bk-native-select-opt', () => {
  /* T16: an atom that paints nothing still has to say its render happened, or the suite
   * is asserting against a tree that may not exist. */
  it('should render the slot that carries its text', async () => {
    const el = await atom();

    expectRendered(el, 'slot');
  });

  it('should keep the label as its own text, readable while it paints nothing', async () => {
    const el = await atom();

    expect(el.textContent!.trim(), 'the text is the label the select mirrors').to.equal('Email');
    expect(getComputedStyle(el).display, 'and the atom itself is not painted').to.equal('none');
  });

  it('should reflect value and disabled, so a programmatic change is observable', async () => {
    const el = await atom();

    el.value = 'sms';
    el.disabled = true;
    await el.updateComplete;

    expect(el.getAttribute('value'), 'value reflects').to.equal('sms');
    expect(el.hasAttribute('disabled'), 'disabled reflects').to.equal(true);

    el.disabled = false;
    await el.updateComplete;

    expect(el.hasAttribute('disabled'), 'and takes it back').to.equal(false);
  });
});
