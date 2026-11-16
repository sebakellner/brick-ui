import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './define.js';
import '../bk-field/define.js';
import type { BkFieldLabel } from '../bk-field/bk-field-label.js';
import type { BkInput } from './bk-input.js';
import { contrastRatio } from '../../test/helpers/contrast.js';
import { hover } from '../../test/helpers/pointer.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkInput) => el.shadowRoot!.querySelector('label')!;
const innerDescription = (el: BkInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BkInput) => el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
const innerRequired = (el: BkInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');

const labelAtom = html`<bk-field-label slot="label">Email</bk-field-label>`;

const descriptionAtom = (text: string) =>
  html`<bk-field-description slot="description">${text}</bk-field-description>`;

const projectedText = (region: HTMLElement) =>
  Array.from(region.querySelector('slot')!.assignedNodes({ flatten: true }))
    .map((node) => node.textContent!.trim())
    .join('');

const colorOf = async (value: string): Promise<string> => {
  const probe = await fixture<HTMLElement>(html`<span style="color: ${value}"></span>`);

  return getComputedStyle(probe).color;
};

const opacityOf = async (value: string): Promise<string> => {
  const probe = await fixture<HTMLElement>(html`<span style="opacity: ${value}"></span>`);

  return getComputedStyle(probe).opacity;
};

describe('bk-input', () => {
  before(loadTheme);

  afterEach(() => {
    document.documentElement.style.removeProperty('--bk-font-weight-medium');
    setTheme('light');
  });

  it('should label the input with a real label element', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);

    expect(projectedText(innerLabel(el))).to.equal('Email');
    expect(innerLabel(el).htmlFor).to.equal(innerInput(el).id);
    expect(innerInput(el).id).to.not.equal('');
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BkInput>(html`<bk-input name="email" label="Email"></bk-input>`);
    await el.updateComplete;

    expect(innerLabel(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
    expect(
      innerLabel(el).hasAttribute('hidden'),
      'a label with no text keeps its place and takes none',
    ).to.equal(true);
  });

  it('should take a description only from the description slot, never from a helper attribute', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input name="email" helper="We never share it."></bk-input>`,
    );
    await el.updateComplete;

    expect(innerDescription(el).textContent!.trim(), 'the attribute describes nothing').to.equal(
      '',
    );
    expect(
      innerInput(el).getAttribute('aria-describedby'),
      'a region with no content is not referenced',
    ).to.equal(null);
  });

  it('should take the label weight from the shared typography token', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);
    document.documentElement.style.setProperty('--bk-font-weight-medium', '700');

    expect(getComputedStyle(innerLabel(el)).fontWeight).to.equal('700');
  });

  it('should describe the input with the slotted description and stay valid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input>${labelAtom}${descriptionAtom('We never share it')}</bk-input>`,
    );

    expect(projectedText(innerDescription(el))).to.equal('We never share it');
    expect(innerDescription(el).getAttribute('data-state')).to.equal(null);
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the error instead of the description and mark the field invalid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input error="Required">${labelAtom}${descriptionAtom('Helper')}</bk-input>`,
    );

    expect(innerError(el).textContent!.trim()).to.equal('Required');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerError(el).id);
  });

  it('should paint its field from the roles', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input style="--bk-bg-surface: rgb(7, 8, 9); --bk-border-default: rgb(1, 2, 3)"
        >${labelAtom}</bk-input
      >`,
    );
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor).to.equal('rgb(7, 8, 9)');
    expect(style.borderTopColor).to.equal('rgb(1, 2, 3)');
  });

  it('should take the label colour from the text role', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);
    el.style.setProperty('--bk-text-default', 'rgb(3, 3, 3)');

    expect(getComputedStyle(innerLabel(el)).color).to.equal('rgb(3, 3, 3)');
  });

  it('should take the disabled field from the surface roles and the opacity primitive', async () => {
    const el = await fixture<BkInput>(html`<bk-input disabled>${labelAtom}</bk-input>`);
    el.style.setProperty('--bk-bg-surface-muted', 'rgb(4, 4, 4)');
    el.style.setProperty('--bk-text-muted', 'rgb(5, 5, 5)');
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor, 'a disabled field keeps the surface role').to.equal(
      await colorOf('var(--bk-bg-surface)'),
    );
    expect(style.color, 'and the default text role').to.equal(
      await colorOf('var(--bk-text-default)'),
    );
    expect(style.opacity, 'the one dim is the disabled opacity').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should take the error border and message from the danger roles', async () => {
    const el = await fixture<BkInput>(html`<bk-input error="Required">${labelAtom}</bk-input>`);
    el.style.setProperty('--bk-border-danger', 'rgb(6, 6, 6)');
    el.style.setProperty('--bk-text-danger', 'rgb(7, 7, 7)');

    expect(getComputedStyle(innerInput(el)).borderTopColor).to.equal('rgb(6, 6, 6)');
    expect(getComputedStyle(innerError(el)).color).to.equal('rgb(7, 7, 7)');
  });

  it('should keep the danger border while the invalid field is hovered', async () => {
    const el = await fixture<BkInput>(html`<bk-input error="Required">${labelAtom}</bk-input>`);
    const field = innerInput(el);
    await hover(field);

    expect(field.matches(':hover')).to.equal(true);
    expect(getComputedStyle(field).borderTopColor).to.equal('rgb(185, 28, 28)');
  });

  it('should pass autocomplete and inputmode through to the field', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input autocomplete="email" inputmode="email">${labelAtom}</bk-input>`,
    );

    expect(innerInput(el).getAttribute('autocomplete')).to.equal('email');
    expect(innerInput(el).getAttribute('inputmode')).to.equal('email');
  });

  it('should keep the message region available to assistive tech while empty', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);
    const message = innerError(el);

    expect(message.getAttribute('role')).to.equal('status');
    expect(message.textContent!.trim()).to.equal('');
    expect(getComputedStyle(message).display).to.not.equal('none');
  });

  it('should submit with the form and restore the initial value on reset', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-input name="email" value="a@b.c">${labelAtom}</bk-input></form>`,
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
      html`<form><bk-input name="email" value="a@b.c">${labelAtom}</bk-input></form>`,
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
          <bk-input name="email" disabled>${labelAtom}</bk-input>
          <bk-input name="other"></bk-input>
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
    const el = await fixture<BkInput>(html`<bk-input disabled>${labelAtom}</bk-input>`);
    const input = innerInput(el);

    expect(input.disabled).to.equal(true);
    expect(input.hasAttribute('disabled')).to.equal(true);
    expect(input.getAttribute('aria-disabled')).to.equal(null);
  });

  it('should refuse typed input while disabled', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input value="a@b.c" disabled>${labelAtom}</bk-input>`,
    );

    el.focus();
    await sendKeys({ type: 'x' });
    await el.updateComplete;

    expect(innerInput(el).value).to.equal('a@b.c');
    expect(el.value).to.equal('a@b.c');
  });

  it('should change nothing under the pointer while the field is disabled', async () => {
    const el = await fixture<BkInput>(html`<bk-input disabled>${labelAtom}</bk-input>`);
    const field = innerInput(el);
    const borderBefore = getComputedStyle(field).borderTopColor;
    const backgroundBefore = getComputedStyle(field).backgroundColor;

    expect(field.matches(':hover'), 'the pointer starts elsewhere').to.equal(false);

    await hover(field);

    expect(field.matches(':hover'), 'the pointer is on the disabled field').to.equal(true);
    expect(getComputedStyle(field).borderTopColor, 'a disabled field has no hover border').to.equal(
      borderBefore,
    );
    expect(
      getComputedStyle(field).backgroundColor,
      'a disabled field has no hover background',
    ).to.equal(backgroundBefore);
  });

  it('should take the disabled opacity from the shared primitive', async () => {
    const el = await fixture<BkInput>(html`<bk-input disabled>${labelAtom}</bk-input>`);
    el.style.setProperty('--bk-opacity-disabled', '0.25');

    expect(getComputedStyle(innerInput(el)).opacity, 'the control dims').to.equal('0.25');
    expect(getComputedStyle(innerLabel(el)).opacity, 'the label row dims').to.equal('0.25');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the field border at 3:1 against its own surface (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);
      const style = getComputedStyle(innerInput(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });
  }

  it('should render no required glyph on an optional field', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);

    expect(Boolean(innerRequired(el)), 'an optional field marks nothing').to.equal(false);
  });

  it('should mark a required field that has a label', async () => {
    const el = await fixture<BkInput>(html`<bk-input required>${labelAtom}</bk-input>`);

    expect(innerRequired(el), 'the label carries the mark').to.not.equal(null);
    expect(innerRequired(el)!.textContent).to.equal('*');
    expect(innerRequired(el)!.closest('label'), 'the mark lives inside the label').to.equal(
      innerLabel(el),
    );
  });

  it('should keep the required glyph out of the accessible name', async () => {
    const el = await fixture<BkInput>(html`<bk-input required>${labelAtom}</bk-input>`);

    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('should keep the native required attribute as what announces the state', async () => {
    const el = await fixture<BkInput>(html`<bk-input required>${labelAtom}</bk-input>`);

    expect(innerInput(el).hasAttribute('required')).to.equal(true);
    expect(innerInput(el).required).to.equal(true);
  });

  it('should mark a required field whose label is a slotted atom', async () => {
    const el = await fixture<BkInput>(html`
      <bk-input required><bk-field-label slot="label">Email</bk-field-label></bk-input>
    `);

    expect(innerRequired(el), 'the slotted label is a label to mark').to.not.equal(null);
  });

  it('should render no glyph for a required field with no label at all', async () => {
    const el = await fixture<BkInput>(html`<bk-input required></bk-input>`);

    expect(Boolean(innerRequired(el)), 'an asterisk beside nothing marks nothing').to.equal(false);
  });

  it('should leave two steps of the space scale under the label', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);

    expect(
      getComputedStyle(innerLabel(el)).marginBlockEnd,
      '--bk-space-2 under the label',
    ).to.equal('8px');
  });

  it('should paint the required glyph with the danger role', async () => {
    const el = await fixture<BkInput>(html`<bk-input required>${labelAtom}</bk-input>`);

    expect(getComputedStyle(innerRequired(el)!).color).to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
  });

  it('should keep the glyph on the label line when the label is slotted', async () => {
    const el = await fixture<BkInput>(html`
      <bk-input required><bk-field-label slot="label">Email</bk-field-label></bk-input>
    `);
    const atom = el.querySelector('bk-field-label')!.getBoundingClientRect();
    const glyph = innerRequired(el)!.getBoundingClientRect();

    expect(glyph.left, 'the glyph follows the slotted label').to.be.at.least(atom.right - 1);
    expect(glyph.top, 'the glyph shares the line with the slotted label').to.be.lessThan(
      atom.bottom,
    );
  });

  it('should paint the label danger while the field is invalid', async () => {
    const el = await fixture<BkInput>(html`<bk-input error="Required">${labelAtom}</bk-input>`);

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should dim the label while the field is disabled, keeping its text role', async () => {
    const el = await fixture<BkInput>(html`<bk-input disabled>${labelAtom}</bk-input>`);

    expect(
      getComputedStyle(innerLabel(el)).color,
      'the label keeps the default text role',
    ).to.equal(await colorOf('var(--bk-text-default)'));
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should let invalid win over disabled on the label', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input error="Required" disabled>${labelAtom}</bk-input>`,
    );

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should still dim a field that is both disabled and invalid', async () => {
    const el = await fixture<BkInput>(
      html`<bk-input error="Required" disabled>${labelAtom}</bk-input>`,
    );
    const label = innerLabel(el);

    expect(label.getAttribute('data-state'), 'invalid wins the state attribute').to.equal(
      'invalid',
    );
    expect(
      label.hasAttribute('data-disabled'),
      'the dim keys off disabled, which the state precedence cannot take away',
    ).to.equal(true);
    expect(getComputedStyle(label).opacity, 'the label row still dims').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
    expect(getComputedStyle(innerInput(el)).opacity, 'and so does the control').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should paint a hosted label atom with the field state', async () => {
    const el = await fixture<BkInput>(html`
      <bk-input error="Required"><bk-field-label slot="label">Email</bk-field-label></bk-input>
    `);
    const atom = el.querySelector<BkFieldLabel>('bk-field-label')!;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should leave a hosted label atom undimmed while the field is disabled', async () => {
    const el = await fixture<BkInput>(html`
      <bk-input disabled><bk-field-label slot="label">Email</bk-field-label></bk-input>
    `);
    const atom = el.querySelector<BkFieldLabel>('bk-field-label')!;

    expect(getComputedStyle(atom).color, 'the atom keeps the default text role').to.equal(
      await colorOf('var(--bk-text-default)'),
    );
    expect(getComputedStyle(atom).opacity, 'the atom is not dimmed on top of its row').to.equal(
      '1',
    );
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row owns the one dim').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should leave a standalone label atom unpainted', async () => {
    const atom = await fixture<BkFieldLabel>(html`<bk-field-label>Email</bk-field-label>`);

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--bk-text-default)'));
  });

  it('should emit bk-change with the value, bubbling out of the shadow root', async () => {
    const el = await fixture<BkInput>(html`<bk-input>${labelAtom}</bk-input>`);
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
