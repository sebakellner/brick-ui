import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;

const formData = (form: HTMLFormElement) => new FormData(form);

describe('bk-checkbox form participation', () => {
  before(loadTheme);

  afterEach(() => {
    setTheme('light');
  });

  it('should submit the platform default while checked and nothing while unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms"></bk-checkbox>
        <bk-checkbox name="other" label="Other" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(formData(form).get('accept')).to.equal(null);
    expect(formData(form).get('other')).to.equal('on');

    el.checked = true;
    await el.updateComplete;

    expect(formData(form).get('accept')).to.equal('on');
  });

  it('should submit the value property instead of the default', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" value="v2" label="Accept terms" checked></bk-checkbox>
      </form>
    `);

    expect(formData(form).get('terms')).to.equal('v2');
  });

  it('should expose the form and refuse to validate while required and unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms" required></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(el.form).to.equal(form);
    expect(form.checkValidity()).to.equal(false);
    expect(el.validity.valueMissing).to.equal(true);

    el.checked = true;
    await el.updateComplete;

    expect(form.checkValidity()).to.equal(true);
  });

  it('should block submission while the error is set', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(el.validity.customError).to.equal(true);
    expect(form.checkValidity()).to.equal(false);
  });

  it('should restore the authored checked attribute on reset and clear the error', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    innerInput(el).click();
    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(el.checked).to.equal(false);
    expect(el.error).to.equal('You have to accept the terms.');

    form.reset();
    await el.updateComplete;

    expect(el.checked).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
    expect(el.error).to.equal('');
  });

  it('should come back with no error and no state after a reset of an unchecked field', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms"></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(true);

    form.reset();
    await el.updateComplete;

    expect(el.checked).to.equal(false);
    expect(innerInput(el).checked).to.equal(false);
  });

  it('should be disabled and still focusable inside a disabled fieldset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <bk-checkbox name="accept" label="Accept terms"></bk-checkbox>
        </fieldset>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(el.fieldDisabled).to.equal(true);
    expect(innerInput(el).getAttribute('aria-disabled')).to.equal('true');

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(false);

    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(innerInput(el));
  });
});
