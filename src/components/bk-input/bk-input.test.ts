import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import './define.js';
import type { BkInput } from './bk-input.js';
import { contrastRatio } from '../../test/helpers/contrast.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkInput) => el.shadowRoot!.querySelector('label')!;
const innerMessage = (el: BkInput) => el.shadowRoot!.querySelector('[part="message"]')!;

describe('bk-input', () => {
  before(loadTheme);

  afterEach(() => {
    document.documentElement.style.removeProperty('--bk-font-weight-medium');
    setTheme('light');
  });

  it('should label the input with a real label element', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);

    expect(innerLabel(el).textContent!.trim()).to.equal('Email');
    expect(innerLabel(el).htmlFor).to.equal(innerInput(el).id);
    expect(innerInput(el).id).to.not.equal('');
  });

  it('should take the label weight from the shared typography token', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);
    document.documentElement.style.setProperty('--bk-font-weight-medium', '700');

    expect(getComputedStyle(innerLabel(el)).fontWeight).to.equal('700');
  });

  it('should describe the input with the helper text and stay valid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" helper="We never share it"></bk-input>`,
    );

    expect(innerMessage(el).textContent!.trim()).to.equal('We never share it');
    expect(innerMessage(el).getAttribute('data-state')).to.equal(null);
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerMessage(el).id);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the error instead of the helper and mark the field invalid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" helper="Helper" error="Required"></bk-input>`,
    );

    expect(innerMessage(el).textContent!.trim()).to.equal('Required');
    expect(innerMessage(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerMessage(el).id);
  });

  it('should paint its field from the roles', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input
        label="Email"
        style="--bk-bg-surface: rgb(7, 8, 9); --bk-border-default: rgb(1, 2, 3)"
      ></bk-input>`,
    );
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor).to.equal('rgb(7, 8, 9)');
    expect(style.borderTopColor).to.equal('rgb(1, 2, 3)');
  });

  it('should take the label colour from the text role', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);
    el.style.setProperty('--bk-text-default', 'rgb(3, 3, 3)');

    expect(getComputedStyle(innerLabel(el)).color).to.equal('rgb(3, 3, 3)');
  });

  it('should take the disabled field from the muted roles', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email" disabled></bk-input>`);
    el.style.setProperty('--bk-bg-surface-muted', 'rgb(4, 4, 4)');
    el.style.setProperty('--bk-text-muted', 'rgb(5, 5, 5)');
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor).to.equal('rgb(4, 4, 4)');
    expect(style.color).to.equal('rgb(5, 5, 5)');
  });

  it('should take the error border and message from the danger roles', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email" error="Required"></bk-input>`);
    el.style.setProperty('--bk-border-danger', 'rgb(6, 6, 6)');
    el.style.setProperty('--bk-text-danger', 'rgb(7, 7, 7)');

    expect(getComputedStyle(innerInput(el)).borderTopColor).to.equal('rgb(6, 6, 6)');
    expect(getComputedStyle(innerMessage(el)).color).to.equal('rgb(7, 7, 7)');
  });

  it('should keep the danger border while the invalid field is hovered', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email" error="Required"></bk-input>`);
    const field = innerInput(el);
    const { x, y, width, height } = field.getBoundingClientRect();
    await sendMouse({
      type: 'move',
      position: [Math.round(x + width / 2), Math.round(y + height / 2)],
    });
    await nextFrame();
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(field.matches(':hover')).to.equal(true);
    expect(getComputedStyle(field).borderTopColor).to.equal('rgb(185, 28, 28)');
  });

  it('should pass autocomplete and inputmode through to the field', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" autocomplete="email" inputmode="email"></bk-input>`,
    );

    expect(innerInput(el).getAttribute('autocomplete')).to.equal('email');
    expect(innerInput(el).getAttribute('inputmode')).to.equal('email');
  });

  it('should keep the message region available to assistive tech while empty', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);
    const message = innerMessage(el);

    expect(message.getAttribute('role')).to.equal('status');
    expect(message.textContent!.trim()).to.equal('');
    expect(getComputedStyle(message).display).to.not.equal('none');
  });

  it('should submit with the form and restore the initial value on reset', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
    );
    const field = form.querySelector('bk-input') as BkInput;
    await field.updateComplete;

    expect(new FormData(form).get('email')).to.equal('a@b.c');

    field.value = 'changed@b.c';
    await field.updateComplete;
    expect(new FormData(form).get('email')).to.equal('changed@b.c');

    form.reset();
    await field.updateComplete;
    expect(field.value).to.equal('a@b.c');
  });

  it('should clear the submitted value on reset without waiting a render', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" value="a@b.c" label="Email"></bk-input></form>`,
    );
    const field = form.querySelector('bk-input') as BkInput;
    field.value = 'changed@b.c';
    await field.updateComplete;

    form.reset();

    expect(new FormData(form).get('email')).to.equal('a@b.c');
  });

  it('should keep an author-disabled field disabled when its fieldset re-enables', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <bk-input name="email" label="Email" disabled></bk-input>
          <bk-input name="other" label="Other"></bk-input>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector('fieldset')!;
    const field = form.querySelector('bk-input') as BkInput;

    const plain = form.querySelectorAll('bk-input')[1] as BkInput;
    expect(innerInput(plain).disabled).to.equal(true);

    fieldset.disabled = false;
    await field.updateComplete;
    await plain.updateComplete;

    expect(field.disabled).to.equal(true);
    expect(innerInput(field).disabled).to.equal(true);
    expect(innerInput(plain).disabled).to.equal(false);
  });

  it('should disable the inner field with the native attribute, not aria-disabled', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email" disabled></bk-input>`);
    const input = innerInput(el);

    expect(input.disabled).to.equal(true);
    expect(input.hasAttribute('disabled')).to.equal(true);
    expect(input.getAttribute('aria-disabled')).to.equal(null);
  });

  it('should refuse typed input while disabled', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" value="a@b.c" disabled></bk-input>`,
    );

    el.focus();
    await sendKeys({ type: 'x' });
    await el.updateComplete;

    expect(innerInput(el).value).to.equal('a@b.c');
    expect(el.value).to.equal('a@b.c');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the field border at 3:1 against its own surface (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);
      const style = getComputedStyle(innerInput(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });
  }

  it('should emit bk-change with the value, bubbling out of the shadow root', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);
    let received: CustomEvent<{ value: string }> | undefined;
    el.addEventListener('bk-change', (event) => {
      received = event as CustomEvent<{ value: string }>;
    });

    const field = innerInput(el);
    field.value = 'hi@brick.dev';
    field.dispatchEvent(new Event('change', { bubbles: true }));

    expect(received?.detail).to.deep.equal({ value: 'hi@brick.dev' });
    expect(received?.bubbles).to.equal(true);
    expect(received?.composed).to.equal(true);
  });
});
