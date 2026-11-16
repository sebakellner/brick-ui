import { colorOf } from '../../../test/helpers/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import '.././define.js';
import type { BkFieldDescription } from '.././bk-field-description.js';

describe('bk-field-description', () => {
  it('should paint the muted text role outside a field', async () => {
    const el = await fixture<BkFieldDescription>(
      html`<bk-field-description>We only use it for the receipt.</bk-field-description>`,
    );

    expect(getComputedStyle(el).color, 'the description takes the muted role').to.equal(
      colorOf('var(--bk-text-muted)'),
    );
    expect(getComputedStyle(el).display, 'a standalone atom still lays out').to.equal('block');
    expect(
      el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
      'and still projects its content',
    ).to.be.greaterThan(0);
  });

  it('should collapse to no space while it is marked empty', async () => {
    const el = await fixture<BkFieldDescription>(
      html`<bk-field-description data-empty>We only use it for the receipt.</bk-field-description>`,
    );
    const style = getComputedStyle(el);

    expect(style.position, 'an empty description is clipped, not removed').to.equal('absolute');
    expect(style.width).to.equal('1px');
    expect(style.height).to.equal('1px');
    expect(Boolean(el.isConnected), 'the empty description stays in the tree').to.equal(true);
    expect(
      el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
      'the empty description still projects its content',
    ).to.be.greaterThan(0);
  });

  it('should hide while it carries the hidden attribute', async () => {
    const el = await fixture<BkFieldDescription>(
      html`<bk-field-description hidden>We only use it for the receipt.</bk-field-description>`,
    );

    expect(getComputedStyle(el).display, 'a hidden description is not rendered').to.equal('none');
    expect(el.getBoundingClientRect().height, 'and takes no space').to.equal(0);
  });
});
