import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import type { BkInput } from './bk-input.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerError = (el: BkInput) => el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const message = (el: BkInput) => innerError(el).textContent!.trim();

const projectedMessage = (el: BkInput) =>
  Array.from(innerError(el).querySelector('slot')!.assignedNodes({ flatten: true }))
    .map((node) => node.textContent!.trim())
    .join(' ');

const settle = async (el: BkInput) => {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
};

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
  it('should show the error instead of the native message when both exist', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" required error="We need this address."></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;
    await touch(el);

    expect(innerInput(el).validity.valueMissing, 'the native control is invalid').to.equal(true);
    expect(innerInput(el).validationMessage).to.not.equal('');
    expect(message(el)).to.equal('We need this address.');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should show nothing and stay out of aria-invalid while an invalid field is untouched', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><bk-input name="email" required></bk-input></form>
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
        <bk-input name="email" type="email" value="you@brick.dev"></bk-input>
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
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should never show a native message under novalidate', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form novalidate><bk-input name="email" required></bk-input></form>
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
        <bk-input name="email" required></bk-input>
        <bk-input name="other" value="ok" required></bk-input>
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
      <form><bk-input name="email" required></bk-input></form>
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
      <form><bk-input name="email" required></bk-input></form>
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
      <form><bk-input name="email" type="email"></bk-input></form>
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

  it('should take a slotted error atom as the field error', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" value="you@brick.dev">
          <bk-field-error slot="error">That address looks wrong.</bk-field-error>
        </bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await settle(el);
    let submitted = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });

    expect(projectedMessage(el), 'the region shows the text of the atom').to.equal(
      'That address looks wrong.',
    );
    expect(
      innerInput(el).getAttribute('aria-invalid'),
      'the atom makes the field invalid',
    ).to.equal('true');
    expect(el.validity.customError, 'the atom takes part in constraint validation').to.equal(true);
    expect(el.validationMessage, 'with the atom text as its message').to.equal(
      'That address looks wrong.',
    );
    expect(form.checkValidity(), 'so the form refuses to validate').to.equal(false);

    form.requestSubmit();

    expect(submitted, 'and the submit is blocked like an error property would block it').to.equal(
      false,
    );
  });

  it('should let the slotted atom win over the error property, and give it back', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" value="you@brick.dev" error="Set by the property.">
          <bk-field-error slot="error">Set by the atom.</bk-field-error>
        </bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await settle(el);

    expect(projectedMessage(el), 'the atom text is what the region shows').to.equal(
      'Set by the atom.',
    );
    expect(el.validationMessage, 'and the atom text is the validity message').to.equal(
      'Set by the atom.',
    );

    const atom = el.querySelector('bk-field-error')!;
    atom.textContent = '';
    await settle(el);

    expect(message(el), 'an atom with no text is not content, so the property shows').to.equal(
      'Set by the property.',
    );
    expect(el.validationMessage, 'and the property is the validity message again').to.equal(
      'Set by the property.',
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should follow the text of the slotted atom while the field sits there', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" value="you@brick.dev">
          <bk-field-error slot="error">Set by the atom.</bk-field-error>
        </bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await settle(el);

    expect(el.validity.customError).to.equal(true);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');

    const atom = el.querySelector('bk-field-error')!;
    atom.textContent = '';
    await settle(el);

    expect(el.checkValidity(), 'emptying the atom makes the field valid').to.equal(true);
    expect(el.validity.customError).to.equal(false);
    expect(el.validationMessage).to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);

    atom.textContent = 'Back again.';
    await settle(el);

    expect(el.checkValidity(), 'and refilling it makes it invalid again').to.equal(false);
    expect(el.validationMessage).to.equal('Back again.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should follow the value on the next keystroke once the field has been touched', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" type="email" value="you@brick.dev"></bk-input>
      </form>
    `);
    const el = form.querySelector('bk-input') as BkInput;
    await el.updateComplete;

    await type(el, 'a@');
    expect(message(el), 'nothing is shown before the first touch').to.equal('');

    await touch(el);
    expect(message(el), 'the blur shows the native message').to.equal(
      innerInput(el).validationMessage,
    );

    await type(el, 'you@brick.dev');

    expect(message(el), 'the next keystroke drops the message the value fixed').to.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);

    await type(el, 'b@');

    expect(message(el), 'and a broken value brings it back while typing').to.equal(
      innerInput(el).validationMessage,
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should block submission for an error a schema result set, until the user acts', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" type="email" value="you@brick.dev"></bk-input>
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
