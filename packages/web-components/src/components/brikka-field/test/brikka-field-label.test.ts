import { colorOf } from '@brikka-ui/test-utils/style.js';
import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '@brikka-ui/test-utils/a11y.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';
import { settle } from '@brikka-ui/test-utils/settle.js';
import '.././define.js';
import '../../brikka-checkbox-group/define.js';
import type { BrikkaCheckboxGroup } from '../../brikka-checkbox-group/brikka-checkbox-group.js';
import type { BrikkaField } from '.././brikka-field.js';
import type { BrikkaFieldLabel } from '.././brikka-field-label.js';

describe('brikka-field-label', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BrikkaFieldLabel>(
          html`<brikka-field-label>Email</brikka-field-label>`,
        );

        await expectRendered(el, 'slot');
        await expectNoViolations(el);
      });
    }

    afterEach(() => setTheme('light'));
  });

  it('should paint the default text role while it carries no state', async () => {
    const el = await fixture<BrikkaFieldLabel>(
      html`<brikka-field-label>Email</brikka-field-label>`,
    );

    expect(el.getAttribute('data-state'), 'nothing painted a state on it').to.equal(null);
    expect(getComputedStyle(el).color).to.equal(colorOf('var(--brikka-text-default)'));
  });

  it('should paint the danger role while the field it sits in is invalid', async () => {
    const field = await fixture<BrikkaField>(
      html`<brikka-field invalid><brikka-field-label>Email</brikka-field-label></brikka-field>`,
    );
    await settle(field);
    const el = field.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(
      getComputedStyle(el).color,
      'the state the field states on its part is the role the atom paints',
    ).to.equal(colorOf('var(--brikka-text-danger)'));
  });

  it('should keep the default text role while the group that hosts it is disabled', async () => {
    const group = await fixture<BrikkaCheckboxGroup>(html`
      <brikka-checkbox-group disabled>
        <brikka-field-label>Notifications</brikka-field-label>
      </brikka-checkbox-group>
    `);
    await settle(group);
    const el = group.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(el.getAttribute('data-state'), 'the group states it on the label it hosts').to.equal(
      'disabled',
    );
    expect(
      getComputedStyle(el).color,
      'the muted role belongs to the row the label sits in, not to the atom',
    ).to.equal(colorOf('var(--brikka-text-default)'));
  });

  it('should weigh itself from the shared typography token', async () => {
    const el = await fixture<BrikkaFieldLabel>(
      html`<brikka-field-label>Email</brikka-field-label>`,
    );
    el.style.setProperty('--brikka-font-weight-medium', '700');

    expect(getComputedStyle(el).fontWeight).to.equal('700');
  });

  it('should lay out and project its content outside a field', async () => {
    const el = await fixture<BrikkaFieldLabel>(
      html`<brikka-field-label>Email</brikka-field-label>`,
    );

    expect(getComputedStyle(el).display, 'a standalone atom still lays out').to.equal('block');
    expect(
      el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
      'and still projects its content',
    ).to.be.greaterThan(0);
  });
});
