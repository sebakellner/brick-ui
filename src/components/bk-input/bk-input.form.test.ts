import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import './define.js';
import type { BkInput } from './bk-input.js';
import { loadTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerMessage = (el: BkInput) => el.shadowRoot!.querySelector('[part="message"]')!;

const type = async (el: BkInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
};

describe('bk-input form integration', () => {
  before(loadTheme);

  describe('form participation', () => {
    it('should enter FormData under its name without a wrapper', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
      );

      expect(new FormData(form).get('email')).to.equal('a@b.c');
    });

    it('should follow the typed value into FormData', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" label="Email"></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;

      await type(el, 'typed@b.c');

      expect(new FormData(form).get('email')).to.equal('typed@b.c');
    });

    it('should submit its value with the form', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
      );
      let submitted: FormData | undefined;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitted = new FormData(form);
      });

      form.requestSubmit();

      expect(submitted?.get('email')).to.equal('a@b.c');
    });

    it('should not enter FormData when it has no name', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input value="a@b.c" label="Email"></bk-input></form>`,
      );

      expect([...new FormData(form).keys()]).to.deep.equal([]);
    });
  });

  describe('reset', () => {
    it('should restore the initial value on reset', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;
      await type(el, 'changed@b.c');

      form.reset();
      await el.updateComplete;

      expect(el.value).to.equal('a@b.c');
      expect(new FormData(form).get('email')).to.equal('a@b.c');
    });

    it('should restore FormData and the field synchronously, before a render', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;
      await type(el, 'changed@b.c');

      form.reset();

      expect(new FormData(form).get('email')).to.equal('a@b.c');
      expect(innerInput(el).value).to.equal('a@b.c');
    });
  });

  describe('a disabled fieldset', () => {
    it('should disable the field with its fieldset and re-enable it', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <fieldset disabled><bk-input name="email" label="Email"></bk-input></fieldset>
        </form>
      `);
      const fieldset = form.querySelector('fieldset')!;
      const el = form.querySelector('bk-input') as BkInput;
      await nextFrame();
      await el.updateComplete;

      expect(innerInput(el).disabled).to.equal(true);
      expect(innerInput(el).getAttribute('aria-disabled')).to.equal(null);

      fieldset.disabled = false;
      await nextFrame();
      await el.updateComplete;

      expect(innerInput(el).disabled).to.equal(false);
    });

    it('should keep an author-disabled field disabled when its fieldset re-enables', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <fieldset disabled>
            <bk-input name="email" label="Email" disabled></bk-input>
          </fieldset>
        </form>
      `);
      const fieldset = form.querySelector('fieldset')!;
      const el = form.querySelector('bk-input') as BkInput;
      await nextFrame();
      await el.updateComplete;

      fieldset.disabled = false;
      await nextFrame();
      await el.updateComplete;

      expect(el.disabled).to.equal(true);
      expect(innerInput(el).disabled).to.equal(true);
      expect(innerInput(el).getAttribute('aria-disabled')).to.equal(null);
    });

    it('should submit nothing and report valid while disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <bk-input name="email" label="Email" value="a@b.c" required disabled></bk-input>
        </form>
      `);
      const el = form.querySelector('bk-input') as BkInput;
      await el.updateComplete;

      expect(new FormData(form).get('email')).to.equal(null);
      expect(el.checkValidity()).to.equal(true);
      expect(form.checkValidity()).to.equal(true);
    });

    it('should block submission with an error only while it is enabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <bk-input
            name="email"
            label="Email"
            error="That address looks wrong."
            disabled
          ></bk-input>
        </form>
      `);
      const el = form.querySelector('bk-input') as BkInput;
      await el.updateComplete;

      expect(el.validity.customError).to.equal(false);
      expect(form.checkValidity()).to.equal(true);

      el.disabled = false;
      await el.updateComplete;

      expect(el.validity.customError).to.equal(true);
      expect(form.checkValidity()).to.equal(false);
    });
  });

  describe('the invalid flow', () => {
    it('should mark the field invalid and block submission while it has an error', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form>
          <bk-input name="email" value="you@brick" error="That address looks wrong."></bk-input>
        </form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;
      let submitted = false;
      let invalidOn: EventTarget | null = null;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitted = true;
      });
      form.addEventListener('invalid', (event) => (invalidOn = event.target), true);

      form.requestSubmit();

      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
      expect(innerMessage(el).textContent!.trim()).to.equal('That address looks wrong.');
      expect(form.checkValidity()).to.equal(false);
      expect(invalidOn).to.equal(el);
      expect(submitted).to.equal(false);
    });

    it('should announce a missing required value and clear it when filled', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" label="Email" required></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;
      await el.updateComplete;

      expect(form.checkValidity()).to.equal(false);

      await type(el, 'a@b.c');

      expect(form.checkValidity()).to.equal(true);
    });

    it('should stay valid while it only has a helper', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form>
          <bk-input name="email" value="a@b.c" helper="We never share it."></bk-input>
        </form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;
      await el.updateComplete;

      expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
      expect(form.checkValidity()).to.equal(true);
    });
  });

  describe('the public form API', () => {
    it('should expose the form it belongs to', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" label="Email"></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;

      expect(el.form === form, 'the form the field points at').to.equal(true);
    });

    it('should expose its validity and validation message', async () => {
      const el = await fixture<BkInput>(
        html`<bk-input name="email" label="Email" error="That address looks wrong."></bk-input>`,
      );

      expect(el.validity.valid).to.equal(false);
      expect(el.validity.customError).to.equal(true);
      expect(el.validationMessage).to.equal('That address looks wrong.');
    });

    it('should answer checkValidity and reportValidity', async () => {
      const el = await fixture<BkInput>(html`<bk-input name="email" required></bk-input>`);
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(true);
      expect(el.checkValidity()).to.equal(false);
      expect(el.reportValidity()).to.equal(false);

      await type(el, 'a@b.c');

      expect(el.validity.valid).to.equal(true);
      expect(el.checkValidity()).to.equal(true);
      expect(el.reportValidity()).to.equal(true);
    });

    it('should restore its value from the browser state', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
      );
      const el = form.querySelector('bk-input') as BkInput;

      el.formStateRestoreCallback('restored@b.c', 'restore');

      expect(el.value).to.equal('restored@b.c');
      expect(new FormData(form).get('email')).to.equal('restored@b.c');
    });
  });
});

describe('bk-input reset semantics', () => {
  it('should reset to the value attribute, not to the value it had when it mounted', async () => {
    const form = await fixture<HTMLFormElement>(html`<form></form>`);
    const el = document.createElement('bk-input') as BkInput;
    el.setAttribute('name', 'email');
    el.setAttribute('label', 'Email');
    el.setAttribute('value', 'default@b.c');
    el.value = 'start@b.c';
    form.append(el);
    await el.updateComplete;

    form.reset();

    expect(el.value).to.equal('default@b.c');
    expect(new FormData(form).get('email')).to.equal('default@b.c');
  });
});

describe('bk-input platform validity', () => {
  it('should reject a value the native control rejects', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" label="Email" type="email" value="nope"></bk-input></form>`,
    );
    const el = form.querySelector('bk-input') as BkInput;

    expect(el.validity.typeMismatch).to.equal(true);
    expect(el.checkValidity()).to.equal(false);
  });

  it('should use the message the platform already localised', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" label="Email" type="email" value="nope"></bk-input></form>`,
    );
    const el = form.querySelector('bk-input') as BkInput;
    const control = el.shadowRoot!.querySelector('input')!;

    expect(el.validationMessage).to.equal(control.validationMessage);
    expect(el.validationMessage).to.not.equal('');
  });

  it('should clear a server error on reset, so the form is not stuck invalid', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" label="Email" value="a@b.c"></bk-input></form>`,
    );
    const el = form.querySelector('bk-input') as BkInput;
    el.error = 'That address is taken.';
    await el.updateComplete;
    expect(el.checkValidity()).to.equal(false);

    form.reset();

    expect(el.error).to.equal('');
    expect(el.checkValidity()).to.equal(true);
  });
});

describe('bk-input required', () => {
  it('should report a required empty field as invalid, with the platform message', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" label="Email" required></bk-input></form>`,
    );
    const el = form.querySelector('bk-input') as BkInput;

    expect(el.validity.valueMissing).to.equal(true);
    expect(el.validationMessage).to.not.equal('');

    el.value = 'a@b.c';
    await el.updateComplete;

    expect(el.validity.valueMissing).to.equal(false);
    expect(el.checkValidity()).to.equal(true);
  });
});
