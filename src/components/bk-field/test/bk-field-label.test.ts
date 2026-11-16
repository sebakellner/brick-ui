import { colorOf } from '../../../test/helpers/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '../../../test/helpers/a11y.js';
import { setTheme } from '../../../test/helpers/theme.js';
import '.././define.js';
import type { BkFieldLabel } from '.././bk-field-label.js';

describe('bk-field-label', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);

        await expectRendered(el, 'slot');
        await expectNoViolations(el);
      });
    }

    afterEach(() => setTheme('light'));
  });

  it('should paint the default text role while it carries no state', async () => {
    const el = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);

    expect(el.getAttribute('data-state'), 'nothing painted a state on it').to.equal(null);
    expect(getComputedStyle(el).color).to.equal(colorOf('var(--bk-text-default)'));
  });

  it('should paint the danger role while it is marked invalid', async () => {
    const el = await fixture<BkFieldLabel>(
      html`<bk-field-label data-state="invalid">Email</bk-field-label>`,
    );

    expect(getComputedStyle(el).color).to.equal(colorOf('var(--bk-text-danger)'));
  });

  it('should keep the default text role while it is marked disabled', async () => {
    const el = await fixture<BkFieldLabel>(
      html`<bk-field-label data-state="disabled">Email</bk-field-label>`,
    );

    expect(
      getComputedStyle(el).color,
      'the muted role belongs to the row the label sits in, not to the atom',
    ).to.equal(colorOf('var(--bk-text-default)'));
  });

  it('should weigh itself from the shared typography token', async () => {
    const el = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);
    el.style.setProperty('--bk-font-weight-medium', '700');

    expect(getComputedStyle(el).fontWeight).to.equal('700');
  });

  it('should lay out and project its content outside a field', async () => {
    const el = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);

    expect(getComputedStyle(el).display, 'a standalone atom still lays out').to.equal('block');
    expect(
      el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
      'and still projects its content',
    ).to.be.greaterThan(0);
  });
});
