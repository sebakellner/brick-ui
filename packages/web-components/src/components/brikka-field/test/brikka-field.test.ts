import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../../brikka-checkbox/define.js';
import '.././define.js';
import type { BrikkaCheckbox } from '../../brikka-checkbox/brikka-checkbox.js';
import type { BrikkaField } from '.././brikka-field.js';
import type { BrikkaFieldDescription } from '.././brikka-field-description.js';
import type { BrikkaFieldError } from '.././brikka-field-error.js';
import type { BrikkaFieldLabel } from '.././brikka-field-label.js';
import { expectNoViolations, expectRendered } from '@brikka-ui/test-utils/a11y.js';
import { colorOf } from '@brikka-ui/test-utils/style.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

const part = <T extends Element>(el: BrikkaField, tag: string) => el.querySelector<T>(tag)!;

const PARTS = ['brikka-field-label', 'brikka-field-description', 'brikka-field-error'];

const top = (el: BrikkaField, tag: string) => part(el, tag).getBoundingClientRect().top;

describe('brikka-field', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BrikkaField>(html`
          <brikka-field>
            <brikka-field-label>Email</brikka-field-label>
            <brikka-field-description>We never share it.</brikka-field-description>
          </brikka-field>
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
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-error>Enter a valid address.</brikka-field-error>
        <brikka-field-description>We only use it for the receipt.</brikka-field-description>
        <brikka-input name="email"></brikka-input>
        <brikka-field-label>Email</brikka-field-label>
      </brikka-field>
    `);
    await el.updateComplete;
    await nextFrame();

    expect(top(el, 'brikka-field-label'), 'the label comes first').to.be.lessThan(
      top(el, 'brikka-input'),
    );
    expect(top(el, 'brikka-input'), 'the control follows the label').to.be.lessThan(
      top(el, 'brikka-field-description'),
    );
    expect(
      top(el, 'brikka-field-description'),
      'the description follows the control',
    ).to.be.lessThan(top(el, 'brikka-field-error'));
  });

  it('should assign the field slot names to the parts it recognises by tag', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-label>Email</brikka-field-label>
        <brikka-input name="email"></brikka-input>
        <brikka-field-description>We only use it for the receipt.</brikka-field-description>
        <brikka-field-error>Enter a valid address.</brikka-field-error>
      </brikka-field>
    `);
    await el.updateComplete;
    await nextFrame();

    expect(part<BrikkaFieldLabel>(el, 'brikka-field-label').slot).to.equal('label');
    expect(part<BrikkaFieldDescription>(el, 'brikka-field-description').slot).to.equal(
      'description',
    );
    expect(part<BrikkaFieldError>(el, 'brikka-field-error').slot).to.equal('error');
    expect(part(el, 'brikka-input').slot, 'the control keeps the default slot').to.equal('');

    for (const tag of PARTS) {
      expect(part(el, tag).getBoundingClientRect().height, `${tag} is rendered`).to.be.greaterThan(
        0,
      );
    }
  });

  it('should claim no role of its own', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-label>Email</brikka-field-label>
        <brikka-input name="email"></brikka-input>
      </brikka-field>
    `);
    await el.updateComplete;

    const stack = el.shadowRoot!.querySelector('.stack')!;

    expect(el.getAttribute('role'), 'a field is a layout, not a widget').to.equal(null);
    expect(stack.getAttribute('role'), 'and so is the stack it lays out with').to.equal(null);
  });

  it('should leave the control unnamed when its atoms are written flat', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-label>Accept the terms</brikka-field-label>
        <brikka-checkbox name="terms"></brikka-checkbox>
      </brikka-field>
    `);
    const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;
    await checkbox.updateComplete;
    const label = checkbox.shadowRoot!.querySelector('label')!;

    expect(
      el.querySelector('brikka-field-label')!.textContent!.trim(),
      'the visual label is still on the page',
    ).to.equal('Accept the terms');
    expect(label.textContent!.trim(), 'but the label beside the control never reaches it').to.equal(
      '',
    );
    expect(
      el.querySelector('brikka-field-label')!.getAttribute('slot'),
      'the atom is slotted to the field, not to the control',
    ).to.equal('label');
  });

  it('should report nothing while the control it holds is invalid', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-checkbox name="terms" required>
          <brikka-field-label>Accept the terms</brikka-field-label>
        </brikka-checkbox>
      </brikka-field>
    `);
    const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;
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
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-label>Email</brikka-field-label>
        <brikka-input name="email"></brikka-input>
        <brikka-field-description>We only use it for the receipt.</brikka-field-description>
        <brikka-field-error>Enter a valid address.</brikka-field-error>
      </brikka-field>
    `);
    await el.updateComplete;

    el.invalid = true;
    await el.updateComplete;

    expect(el.hasAttribute('invalid'), 'the attribute reflects the property').to.equal(true);
    expect(
      getComputedStyle(part(el, 'brikka-field-label')).color,
      'the label paints danger',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));
    expect(
      getComputedStyle(part(el, 'brikka-field-description')).color,
      'the description keeps its muted role: the state names, it does not repaint it',
    ).to.equal(await colorOf('var(--brikka-text-muted)'));
    expect(
      getComputedStyle(part(el, 'brikka-field-error')).color,
      'and the error is danger with or without the state',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));

    el.invalid = false;
    await el.updateComplete;

    expect(el.hasAttribute('invalid'), 'the attribute follows the property').to.equal(false);
    expect(
      getComputedStyle(part(el, 'brikka-field-label')).color,
      'and the paint goes away with it',
    ).to.equal(await colorOf('var(--brikka-text-default)'));
  });

  it('should space the parts from the field and not from the atoms', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field>
        <brikka-field-label>Email</brikka-field-label>
        <brikka-input name="email"></brikka-input>
        <brikka-field-description>We only use it for the receipt.</brikka-field-description>
      </brikka-field>
    `);
    await el.updateComplete;
    await nextFrame();

    for (const tag of ['brikka-field-label', 'brikka-field-description']) {
      const style = getComputedStyle(part(el, tag));
      expect(style.marginBlockStart, `${tag} adds no leading margin`).to.equal('0px');
      expect(style.marginBlockEnd, `${tag} adds no trailing margin`).to.equal('0px');
    }

    const labelGap =
      part(el, 'brikka-input').getBoundingClientRect().top -
      part(el, 'brikka-field-label').getBoundingClientRect().bottom;
    const descriptionGap =
      part(el, 'brikka-field-description').getBoundingClientRect().top -
      part(el, 'brikka-input').getBoundingClientRect().bottom;

    expect(labelGap, 'one --brikka-space-1 under the label').to.equal(4);
    expect(descriptionGap, 'one --brikka-space-1 above the description').to.equal(4);
  });

  it('should leave the state of a part a control hosts alone', async () => {
    const el = await fixture<BrikkaField>(html`
      <brikka-field invalid>
        <brikka-checkbox name="terms" disabled>
          <brikka-field-label>Accept the terms</brikka-field-label>
        </brikka-checkbox>
      </brikka-field>
    `);
    await el.updateComplete;
    await nextFrame();

    const hosted = el.querySelector('brikka-field-label')!;

    /* The atom paints the same either way — the dim belongs to the row (C5) — so the
     * attribute is the only witness that the control, not the field, owns the state. */
    expect(
      hosted.getAttribute('data-state'),
      'the control owns the state of the label it hosts, and invalid does not overwrite it',
    ).to.equal('disabled');
    expect(
      getComputedStyle(hosted).color,
      'and the invalid on the field never reaches the hosted atom',
    ).to.equal(await colorOf('var(--brikka-text-default)'));
  });
});
