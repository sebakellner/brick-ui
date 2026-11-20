import { colorOf } from '../../../../../../test/helpers/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '../../../../../../test/helpers/a11y.js';
import { setTheme } from '../../../../../../test/helpers/theme.js';
import { settle } from '../../../../../../test/helpers/settle.js';
import '.././define.js';
import type { BkFieldError } from '.././bk-field-error.js';

describe('bk-field-error', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkFieldError>(html`<bk-field-error>Required</bk-field-error>`);

        await expectRendered(el, 'slot');
        await expectNoViolations(el);
      });
    }

    afterEach(() => setTheme('light'));
  });

  it('should paint the danger text role outside a field', async () => {
    const el = await fixture<BkFieldError>(
      html`<bk-field-error>Enter a valid address.</bk-field-error>`,
    );

    expect(getComputedStyle(el).color, 'the error takes the danger role').to.equal(
      colorOf('var(--bk-text-danger)'),
    );
    expect(getComputedStyle(el).display, 'a standalone atom still lays out').to.equal('block');
    expect(
      el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
      'and still projects its content',
    ).to.be.greaterThan(0);
  });

  it('should paint the danger role whatever state it carries', async () => {
    const el = await fixture<BkFieldError>(
      html`<bk-field-error>Enter a valid address.</bk-field-error>`,
    );

    expect(getComputedStyle(el).color).to.equal(colorOf('var(--bk-text-danger)'));

    el.setAttribute('data-state', 'error');
    await el.updateComplete;

    expect(
      getComputedStyle(el).color,
      'the state attribute decorates the control region, and the atom is danger either way',
    ).to.equal(colorOf('var(--bk-text-danger)'));
  });

  it('should clip itself to no space while it has no text, with no container involved', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <bk-field-error></bk-field-error>
        <bk-field-error>Pick at least one.</bk-field-error>
      </div>
    `);
    const [el, control] = Array.from(container.querySelectorAll<BkFieldError>('bk-field-error'));
    await settle(el);
    await settle(control);
    const style = getComputedStyle(el);

    expect(el.hasAttribute('data-empty'), 'the empty atom is the one that says so').to.equal(true);
    expect(style.position, 'the empty error is clipped, not removed').to.equal('absolute');
    expect(style.width).to.equal('1px');
    expect(style.height).to.equal('1px');
    expect(Boolean(el.isConnected), 'the empty error stays in the tree').to.equal(true);

    expect(
      control.hasAttribute('data-empty'),
      'the sibling with text carries no mark, and no container wrote one',
    ).to.equal(false);
    expect(getComputedStyle(control).position, 'so it is not clipped').to.not.equal('absolute');
    expect(getComputedStyle(control).display, 'and it lays out').to.equal('block');
    expect(
      control.getBoundingClientRect().width,
      'taking the width its text needs',
    ).to.be.greaterThan(1);

    el.textContent = 'Now it has text.';
    await settle(el);

    expect(el.hasAttribute('data-empty'), 'its own text clears the mark').to.equal(false);
    expect(getComputedStyle(el).position, 'and gives the atom its place back').to.not.equal(
      'absolute',
    );
  });

  it('should hide while it carries the hidden attribute', async () => {
    const el = await fixture<BkFieldError>(
      html`<bk-field-error hidden>Enter a valid address.</bk-field-error>`,
    );

    expect(getComputedStyle(el).display, 'a hidden error is not rendered').to.equal('none');
    expect(el.getBoundingClientRect().height, 'and takes no space').to.equal(0);
  });
});
