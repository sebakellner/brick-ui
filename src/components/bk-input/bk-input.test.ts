import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';
import './bk-input.js';
import type { BkInput } from './bk-input.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkInput) => el.shadowRoot!.querySelector('label')!;
const innerMessage = (el: BkInput) => el.shadowRoot!.querySelector('[part="message"]')!;

describe('bk-input', () => {
  it('should label the input with a real label element', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email"></bk-input>`);

    expect(innerLabel(el).textContent!.trim()).to.equal('Email');
    expect(innerLabel(el).htmlFor).to.equal(innerInput(el).id);
    expect(innerInput(el).id).to.not.equal('');
  });

  it('should describe the input with the helper text and stay valid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" helper="We never share it"></bk-input>`,
    );

    expect(innerMessage(el).textContent!.trim()).to.equal('We never share it');
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerMessage(el).id);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the error instead of the helper and mark the field invalid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input label="Email" helper="Helper" error="Required"></bk-input>`,
    );

    expect(innerMessage(el).textContent!.trim()).to.equal('Required');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerMessage(el).id);
  });

  it('should paint its field from the control tokens', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input
        label="Email"
        style="--bk-input-bg: rgb(7, 8, 9); --bk-input-border-color: rgb(1, 2, 3)"
      ></bk-input>`,
    );
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor).to.equal('rgb(7, 8, 9)');
    expect(style.borderTopColor).to.equal('rgb(1, 2, 3)');
  });

  it('should keep the danger border while the invalid field is hovered', async () => {
    const el = await fixture<BkInput>(html`<bk-input label="Email" error="Required"></bk-input>`);
    const field = innerInput(el);
    const { x, y, width, height } = field.getBoundingClientRect();
    await sendMouse({ type: 'move', position: [Math.round(x + width / 2), Math.round(y + height / 2)] });
    await nextFrame();
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(field.matches(':hover')).to.equal(true);
    expect(getComputedStyle(field).borderTopColor).to.equal('rgb(185, 28, 28)');
  });

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
