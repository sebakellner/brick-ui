import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import './define.js';
import type { BkField } from './bk-field.js';
import type { BkFieldDescription } from './bk-field-description.js';
import type { BkFieldError } from './bk-field-error.js';
import type { BkFieldLabel } from './bk-field-label.js';
import { loadTheme } from '../../test/helpers/theme.js';

const part = <T extends Element>(el: BkField, tag: string) => el.querySelector<T>(tag)!;

const PARTS = ['bk-field-label', 'bk-field-description', 'bk-field-error'];

const states = (el: BkField) => PARTS.map((tag) => part(el, tag).getAttribute('data-state'));

const top = (el: BkField, tag: string) => part(el, tag).getBoundingClientRect().top;

describe('bk-field', () => {
  before(loadTheme);

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

  it('should put data-state on every part while invalid and take it away again', async () => {
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
    expect(states(el)).to.deep.equal(['invalid', 'invalid', 'invalid']);

    el.invalid = false;
    await el.updateComplete;

    expect(el.hasAttribute('invalid'), 'the attribute follows the property').to.equal(false);
    expect(states(el)).to.deep.equal([null, null, null]);
  });

  it('should paint every part from its own semantic role outside a field', async () => {
    const label = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);
    label.style.setProperty('--bk-text-default', 'rgb(1, 2, 3)');
    label.style.setProperty('--bk-font-weight-medium', '700');

    const labelStyle = getComputedStyle(label);
    expect(labelStyle.color, 'the label takes the default text role').to.equal('rgb(1, 2, 3)');
    expect(labelStyle.fontWeight, 'the label takes the medium weight').to.equal('700');

    const description = await fixture<BkFieldDescription>(
      html`<bk-field-description>We only use it for the receipt.</bk-field-description>`,
    );
    description.style.setProperty('--bk-text-muted', 'rgb(4, 5, 6)');

    const descriptionStyle = getComputedStyle(description);
    expect(descriptionStyle.color, 'the description takes the muted role').to.equal('rgb(4, 5, 6)');

    const error = await fixture<BkFieldError>(
      html`<bk-field-error>Enter a valid address.</bk-field-error>`,
    );
    error.style.setProperty('--bk-text-danger', 'rgb(7, 8, 9)');

    const errorStyle = getComputedStyle(error);
    expect(errorStyle.color, 'the error takes the danger role').to.equal('rgb(7, 8, 9)');

    for (const el of [label, description, error]) {
      const style = getComputedStyle(el);
      expect(style.display, 'a part outside a field still lays out').to.equal('block');
      expect(
        el.shadowRoot!.querySelector('slot')!.assignedNodes({ flatten: true }).length,
        'a part outside a field still projects its content',
      ).to.be.greaterThan(0);
      expect(el.getAttribute('data-state'), 'a part outside a field carries no state').to.equal(
        null,
      );
    }
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
});
