import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import type { BkInput } from './bk-input.js';
import { loadTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerMessage = (el: BkInput) => el.shadowRoot!.querySelector('[part="message"]')!;

const message = (el: BkInput) => innerMessage(el).textContent!.trim();

const type = async (el: BkInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
};

const touch = async (el: BkInput) => {
  const field = innerInput(el);
  field.focus();
  field.blur();
  await el.updateComplete;
};

describe('bk-input error model', () => {
  before(loadTheme);

  it('should show the error instead of the native message when both exist', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" label="Email" required error="We need this address."></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;
    await touch(el);

    expect(innerInput(el).validity.valueMissing, 'the native control is invalid').to.equal(true);
    expect(innerInput(el).validationMessage).to.not.equal('');
    expect(message(el)).to.equal('We need this address.');
    expect(innerMessage(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should show nothing and stay out of aria-invalid while an invalid field is untouched', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><bk-input name="email" label="Email" required></bk-input></form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;
    el.requestUpdate();
    await el.updateComplete;

    expect(el.validity.valueMissing).to.equal(true);
    expect(el.fieldMessage).to.equal('');
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the native message after a blur and never while typing', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" label="Email" type="email" value="you@brick.dev"></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;

    await type(el, 'a@');
    expect(innerInput(el).validity.typeMismatch).to.equal(true);
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);

    const native = innerInput(el).validationMessage;
    expect(native).to.not.equal('');

    await touch(el);

    expect(message(el)).to.equal(native);
    expect(innerMessage(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should never show a native message under novalidate', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form novalidate><bk-input name="email" label="Email" required></bk-input></form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;
    let submitted = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });

    await touch(el);
    form.requestSubmit();
    await el.updateComplete;

    expect(submitted, 'novalidate lets the submit through').to.equal(true);
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);

    el.error = 'We need your address.';
    await el.updateComplete;

    expect(message(el)).to.equal('We need your address.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should show the native message only on the fields a failed submit rejected', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" label="Email" required></bk-input>
        <bk-input name="other" label="Other" value="ok" required></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    const other = form.querySelectorAll('bk-input')[1] as BkInput;
    await el.updateComplete;
    await other.updateComplete;
    let submitted = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });

    form.requestSubmit();
    await el.updateComplete;
    await other.updateComplete;

    expect(submitted).to.equal(false);
    expect(message(el)).to.equal(innerInput(el).validationMessage);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(message(other)).to.equal('');
    expect(innerInput(other).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the native message when a consumer reports the field explicitly', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><bk-input name="email" label="Email" required></bk-input></form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;

    el.showValidationMessage();
    await el.updateComplete;

    expect(message(el)).to.equal(innerInput(el).validationMessage);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should clear the error, the touched state and aria-invalid on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><bk-input name="email" label="Email" required></bk-input></form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    el.error = 'That address is taken.';
    await el.updateComplete;
    await touch(el);

    expect(message(el)).to.equal('That address is taken.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');

    form.reset();
    await el.updateComplete;

    expect(el.error).to.equal('');
    expect(el.validity.valueMissing, 'the reset field is still natively invalid').to.equal(true);
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should not mark the field touched when the browser restores a value', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><bk-input name="email" label="Email" type="email"></bk-input></form>
    `);
    const el = form.querySelector('bk-input') as BkInput;

    el.formStateRestoreCallback('nope', 'restore');
    el.requestUpdate();
    await el.updateComplete;

    expect(el.value).to.equal('nope');
    expect(el.validity.typeMismatch).to.equal(true);
    expect(el.fieldMessage).to.equal('');
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should block submission for an error a schema result set, until the user acts', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" label="Email" type="email" value="you@brick.dev"></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;
    let submitted = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });

    const result = { success: false as const, message: 'That address looks wrong.' };
    el.error = result.success ? '' : result.message;
    await el.updateComplete;

    expect(form.checkValidity()).to.equal(false);
    expect(el.validity.customError).to.equal(true);
    expect(message(el)).to.equal('That address looks wrong.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    form.requestSubmit();
    expect(submitted).to.equal(false);

    el.value = 'changed@brick.dev';
    await el.updateComplete;
    expect(message(el), 'a value change alone keeps the message').to.equal(
      'That address looks wrong.',
    );

    await type(el, 'changed@brick.dev');

    expect(el.error).to.equal('');
    expect(message(el)).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
    expect(form.checkValidity()).to.equal(true);
  });
});
