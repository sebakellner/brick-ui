import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../../bk-checkbox/define.js';
import '.././define.js';
import type { BkCheckbox } from '../../bk-checkbox/bk-checkbox.js';
import type { BkField } from '.././bk-field.js';
import type { BkFieldDescription } from '.././bk-field-description.js';
import type { BkFieldError } from '.././bk-field-error.js';
import type { BkFieldLabel } from '.././bk-field-label.js';
import { expectNoViolations, expectRendered } from '../../../../../../test/helpers/a11y.js';
import { colorOf } from '../../../../../../test/helpers/style.js';
import { setTheme } from '../../../../../../test/helpers/theme.js';

const part = <T extends Element>(el: BkField, tag: string) => el.querySelector<T>(tag)!;

const PARTS = ['bk-field-label', 'bk-field-description', 'bk-field-error'];

const top = (el: BkField, tag: string) => part(el, tag).getBoundingClientRect().top;

describe('bk-field', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkField>(html`
          <bk-field>
            <bk-field-label>Email</bk-field-label>
            <bk-field-description>We never share it.</bk-field-description>
          </bk-field>
        `);

        await expectRendered(el, 'slot');
        await expectNoViolations(el);
      });
    }
  });
  afterEach(() => {
    setTheme('light');
  });
  it('should stack label, control, description and error in that order', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-error>Enter a valid address.</bk-field-error>
        <bk-field-description>We only use it for the receipt.</bk-field-description>
        <bk-input name="email"></bk-input>
        <bk-field-label>Email</bk-field-label>
      </bk-field>
    `);
    await el.updateComplete;
    await nextFrame();

    expect(top(el, 'bk-field-label'), 'the label comes first').to.be.lessThan(top(el, 'bk-input'));
    expect(top(el, 'bk-input'), 'the control follows the label').to.be.lessThan(
      top(el, 'bk-field-description'),
    );
    expect(top(el, 'bk-field-description'), 'the description follows the control').to.be.lessThan(
      top(el, 'bk-field-error'),
    );
  });

  it('should assign the field slot names to the parts it recognises by tag', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-label>Email</bk-field-label>
        <bk-input name="email"></bk-input>
        <bk-field-description>We only use it for the receipt.</bk-field-description>
        <bk-field-error>Enter a valid address.</bk-field-error>
      </bk-field>
    `);
    await el.updateComplete;
    await nextFrame();

    expect(part<BkFieldLabel>(el, 'bk-field-label').slot).to.equal('label');
    expect(part<BkFieldDescription>(el, 'bk-field-description').slot).to.equal('description');
    expect(part<BkFieldError>(el, 'bk-field-error').slot).to.equal('error');
    expect(part(el, 'bk-input').slot, 'the control keeps the default slot').to.equal('');

    for (const tag of PARTS) {
      expect(part(el, tag).getBoundingClientRect().height, `${tag} is rendered`).to.be.greaterThan(
        0,
      );
    }
  });

  it('should claim no role of its own', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-label>Email</bk-field-label>
        <bk-input name="email"></bk-input>
      </bk-field>
    `);
    await el.updateComplete;

    const stack = el.shadowRoot!.querySelector('.stack')!;

    expect(el.getAttribute('role'), 'a field is a layout, not a widget').to.equal(null);
    expect(stack.getAttribute('role'), 'and so is the stack it lays out with').to.equal(null);
  });

  it('should leave the control unnamed when its atoms are written flat', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-label>Accept the terms</bk-field-label>
        <bk-checkbox name="terms"></bk-checkbox>
      </bk-field>
    `);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;
    await checkbox.updateComplete;
    const label = checkbox.shadowRoot!.querySelector('label')!;

    expect(
      el.querySelector('bk-field-label')!.textContent!.trim(),
      'the visual label is still on the page',
    ).to.equal('Accept the terms');
    expect(label.textContent!.trim(), 'but the label beside the control never reaches it').to.equal(
      '',
    );
    expect(
      el.querySelector('bk-field-label')!.getAttribute('slot'),
      'the atom is slotted to the field, not to the control',
    ).to.equal('label');
  });

  it('should report nothing while the control it holds is invalid', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-checkbox name="terms" required>
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
    `);
    const checkbox = el.querySelector('bk-checkbox') as BkCheckbox;
    const input = checkbox.shadowRoot!.querySelector('input')!;
    await el.updateComplete;

    input.focus();
    input.blur();
    await checkbox.updateComplete;

    expect(checkbox.checkValidity(), 'the control is invalid').to.equal(false);
    expect(input.getAttribute('aria-invalid'), 'and shows a problem').to.equal('true');
    expect(el.invalid, 'the field derives nothing from the control').to.equal(false);
    expect(el.hasAttribute('invalid'), 'and paints no state').to.equal(false);
  });

  it('should paint every part it states while invalid, and take the paint away again', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-label>Email</bk-field-label>
        <bk-input name="email"></bk-input>
        <bk-field-description>We only use it for the receipt.</bk-field-description>
        <bk-field-error>Enter a valid address.</bk-field-error>
      </bk-field>
    `);
    await el.updateComplete;

    el.invalid = true;
    await el.updateComplete;

    expect(el.hasAttribute('invalid'), 'the attribute reflects the property').to.equal(true);
    expect(getComputedStyle(part(el, 'bk-field-label')).color, 'the label paints danger').to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
    expect(
      getComputedStyle(part(el, 'bk-field-description')).color,
      'the description keeps its muted role: the state names, it does not repaint it',
    ).to.equal(await colorOf('var(--bk-text-muted)'));
    expect(
      getComputedStyle(part(el, 'bk-field-error')).color,
      'and the error is danger with or without the state',
    ).to.equal(await colorOf('var(--bk-text-danger)'));

    el.invalid = false;
    await el.updateComplete;

    expect(el.hasAttribute('invalid'), 'the attribute follows the property').to.equal(false);
    expect(
      getComputedStyle(part(el, 'bk-field-label')).color,
      'and the paint goes away with it',
    ).to.equal(await colorOf('var(--bk-text-default)'));
  });

  it('should space the parts from the field and not from the atoms', async () => {
    const el = await fixture<BkField>(html`
      <bk-field>
        <bk-field-label>Email</bk-field-label>
        <bk-input name="email"></bk-input>
        <bk-field-description>We only use it for the receipt.</bk-field-description>
      </bk-field>
    `);
    await el.updateComplete;
    await nextFrame();

    for (const tag of ['bk-field-label', 'bk-field-description']) {
      const style = getComputedStyle(part(el, tag));
      expect(style.marginBlockStart, `${tag} adds no leading margin`).to.equal('0px');
      expect(style.marginBlockEnd, `${tag} adds no trailing margin`).to.equal('0px');
    }

    const labelGap =
      part(el, 'bk-input').getBoundingClientRect().top -
      part(el, 'bk-field-label').getBoundingClientRect().bottom;
    const descriptionGap =
      part(el, 'bk-field-description').getBoundingClientRect().top -
      part(el, 'bk-input').getBoundingClientRect().bottom;

    expect(labelGap, 'one --bk-space-1 under the label').to.equal(4);
    expect(descriptionGap, 'one --bk-space-1 above the description').to.equal(4);
  });

  it('should leave the state of a part a control hosts alone', async () => {
    const el = await fixture<BkField>(html`
      <bk-field invalid>
        <bk-checkbox name="terms" disabled>
          <bk-field-label>Accept the terms</bk-field-label>
        </bk-checkbox>
      </bk-field>
    `);
    await el.updateComplete;
    await nextFrame();

    const hosted = el.querySelector('bk-field-label')!;

    /* The atom paints the same either way — the dim belongs to the row (C5) — so the
     * attribute is the only witness that the control, not the field, owns the state. */
    expect(
      hosted.getAttribute('data-state'),
      'the control owns the state of the label it hosts, and invalid does not overwrite it',
    ).to.equal('disabled');
    expect(
      getComputedStyle(hosted).color,
      'and the invalid on the field never reaches the hosted atom',
    ).to.equal(await colorOf('var(--bk-text-default)'));
  });
});
