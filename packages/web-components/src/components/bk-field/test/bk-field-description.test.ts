import { colorOf } from '@brick/test-utils/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '@brick/test-utils/a11y.js';
import { setTheme } from '@brick/test-utils/theme.js';
import { settle } from '@brick/test-utils/settle.js';
import '.././define.js';
import type { BkFieldDescription } from '.././bk-field-description.js';

describe('bk-field-description', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkFieldDescription>(
          html`<bk-field-description>We never share it.</bk-field-description>`,
        );

        await expectRendered(el, 'slot');
        await expectNoViolations(el);
      });
    }

    afterEach(() => setTheme('light'));
  });

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

  it('should clip itself to no space while it has no text, with no container involved', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <bk-field-description></bk-field-description>
        <bk-field-description>Pick at least one.</bk-field-description>
      </div>
    `);
    const [el, control] = Array.from(
      container.querySelectorAll<BkFieldDescription>('bk-field-description'),
    );
    await settle(el);
    await settle(control);
    const style = getComputedStyle(el);

    expect(el.hasAttribute('data-empty'), 'the empty atom is the one that says so').to.equal(true);
    expect(style.position, 'the empty description is clipped, not removed').to.equal('absolute');
    expect(style.width).to.equal('1px');
    expect(style.height).to.equal('1px');
    expect(Boolean(el.isConnected), 'the empty description stays in the tree').to.equal(true);

    expect(
      control.hasAttribute('data-empty'),
      'the sibling with text carries no mark, and no container wrote one',
    ).to.equal(false);
    expect(getComputedStyle(control).position, 'so it is not clipped').to.not.equal('absolute');
    expect(getComputedStyle(control).display, 'and it lays out').to.equal('block');

    el.textContent = 'Now it has text.';
    await settle(el);

    expect(el.hasAttribute('data-empty'), 'its own text clears the mark').to.equal(false);
    expect(getComputedStyle(el).position, 'and gives the atom its place back').to.not.equal(
      'absolute',
    );
  });

  it('should hide while it carries the hidden attribute', async () => {
    const el = await fixture<BkFieldDescription>(
      html`<bk-field-description hidden>We only use it for the receipt.</bk-field-description>`,
    );

    expect(getComputedStyle(el).display, 'a hidden description is not rendered').to.equal('none');
    expect(el.getBoundingClientRect().height, 'and takes no space').to.equal(0);
  });
});
