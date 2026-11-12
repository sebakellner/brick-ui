import { expect, fixture, html } from '@open-wc/testing';
import './bk-button.js';
import type { BkButton } from './bk-button.js';

const innerButton = (el: BkButton) => el.shadowRoot!.querySelector('button')!;

describe('bk-button', () => {
  it('defaults to the primary variant, reflected on the host', async () => {
    const el = await fixture<BkButton>(html`<bk-button>Save</bk-button>`);

    expect(el.variant).to.equal('primary');
    expect(el.getAttribute('variant')).to.equal('primary');
    expect(innerButton(el).getAttribute('part')).to.equal('button');
  });

  it('propagates disabled to the native button, which stops firing clicks', async () => {
    const el = await fixture<BkButton>(html`<bk-button disabled>Save</bk-button>`);
    let clicks = 0;
    el.addEventListener('click', () => (clicks += 1));

    innerButton(el).click();

    expect(el.disabled).to.equal(true);
    expect(innerButton(el).disabled).to.equal(true);
    expect(clicks).to.equal(0);
  });

  it('lets a public custom property win over the variant default', async () => {
    const el = await fixture<BkButton>(
      html`<bk-button variant="ghost" style="--bk-button-bg: rgb(1, 2, 3)">Save</bk-button>`,
    );

    expect(getComputedStyle(innerButton(el)).backgroundColor).to.equal('rgb(1, 2, 3)');
  });
});
