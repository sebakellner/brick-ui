import { colorOf } from '../../../test/helpers/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '../../../test/helpers/a11y.js';
import { setTheme } from '../../../test/helpers/theme.js';
import { settle } from '../../../test/helpers/settle.js';
import '.././define.js';
import '../../bk-checkbox-group/define.js';
import type { BkCheckboxGroup } from '../../bk-checkbox-group/bk-checkbox-group.js';
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

  it('should collapse to no space while the group that owns it marks it empty', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <bk-checkbox-group>
          <bk-field-label>Notifications</bk-field-label>
          <bk-field-description></bk-field-description>
        </bk-checkbox-group>
        <bk-checkbox-group>
          <bk-field-label>Notifications</bk-field-label>
          <bk-field-description>Pick at least one.</bk-field-description>
        </bk-checkbox-group>
      </div>
    `);
    const empty = container.querySelector<BkCheckboxGroup>('bk-checkbox-group')!;
    const filled = container.querySelector<BkCheckboxGroup>('bk-checkbox-group:last-child')!;
    await settle(empty);
    await settle(filled);
    const el = empty.querySelector<BkFieldDescription>(':scope > bk-field-description')!;
    const control = filled.querySelector<BkFieldDescription>(':scope > bk-field-description')!;
    const style = getComputedStyle(el);

    expect(style.position, 'the empty region the group marks is clipped, not removed').to.equal(
      'absolute',
    );
    expect(style.width).to.equal('1px');
    expect(style.height).to.equal('1px');
    expect(Boolean(el.isConnected), 'the empty description stays in the tree').to.equal(true);

    expect(
      getComputedStyle(control).position,
      'the sibling with text is not clipped: the mark came from the group',
    ).to.not.equal('absolute');
    expect(getComputedStyle(control).display, 'and it lays out').to.equal('block');
  });

  it('should hide while it carries the hidden attribute', async () => {
    const el = await fixture<BkFieldDescription>(
      html`<bk-field-description hidden>We only use it for the receipt.</bk-field-description>`,
    );

    expect(getComputedStyle(el).display, 'a hidden description is not rendered').to.equal('none');
    expect(el.getBoundingClientRect().height, 'and takes no space').to.equal(0);
  });
});
