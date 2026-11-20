import { settle } from '@brikka/test-utils/settle.js';
import { colorOf, opacityOf } from '@brikka/test-utils/style.js';
import {
  describedNode,
  projectedNodes,
  projectedText,
  region,
  slottedText,
} from '@brikka/test-utils/dom.js';
import { descriptionAtom, labelAtom } from '@brikka/test-utils/atoms.js';
import { watchSubmit } from '@brikka/test-utils/form.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import '.././define.js';
import '../../brikka-field/define.js';
import type { BrikkaField } from '../../brikka-field/brikka-field.js';
import type { BrikkaFieldLabel } from '../../brikka-field/brikka-field-label.js';
import type { BrikkaInput } from '.././brikka-input.js';
import { contrastRatio } from '@brikka/test-utils/contrast.js';
import { expectNoViolations, expectRendered } from '@brikka/test-utils/a11y.js';
import { hover, hoverCapable } from '@brikka/test-utils/pointer.js';
import { setTheme } from '@brikka/test-utils/theme.js';

const innerInput = (el: BrikkaInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BrikkaInput) => el.shadowRoot!.querySelector('label')!;
const innerDescription = (el: BrikkaInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BrikkaInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
const innerRequired = (el: BrikkaInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');

const message = (el: BrikkaInput) => innerError(el).textContent!.trim();

const projectedMessage = (el: BrikkaInput) => projectedText(innerError(el));

const type = async (el: BrikkaInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
};

// The form suite dispatched a bubbling, non-composed input event. The two helpers do
// the same work for the component's own listener, but each concern keeps the event it
// was proven with rather than one of them flattening the other.
const typeBubbling = async (el: BrikkaInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
};

const touch = async (el: BrikkaInput) => {
  const field = innerInput(el);
  field.focus();
  field.blur();
  await el.updateComplete;
};

describe('brikka-input', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BrikkaInput>(
          html`<brikka-input>${labelAtom('Email')}</brikka-input>`,
        );

        await expectRendered(el, 'input');
        await expectNoViolations(el);
      });
    }
  });
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--brikka-font-weight-medium');
    setTheme('light');
  });

  it('should label the input with a real label element', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);

    expect(projectedText(innerLabel(el))).to.equal('Email');
    expect(innerLabel(el).htmlFor).to.equal(innerInput(el).id);
    expect(innerInput(el).id).to.not.equal('');
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input name="email" label="Email"></brikka-input>`,
    );
    await el.updateComplete;

    expect(innerLabel(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
    expect(
      innerLabel(el).hasAttribute('hidden'),
      'a label with no text keeps its place and takes none',
    ).to.equal(true);
    expect(
      getComputedStyle(innerLabel(el)).display,
      'and the hidden label is collapsed, not only marked',
    ).to.equal('none');
  });

  it('should take a description only from the description slot, never from a helper attribute', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input name="email" helper="We never share it."></brikka-input>`,
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
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);
    document.documentElement.style.setProperty('--brikka-font-weight-medium', '700');

    expect(getComputedStyle(innerLabel(el)).fontWeight).to.equal('700');
  });

  it('should describe the input with the slotted description and stay valid', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input
        >${labelAtom('Email')}${descriptionAtom('We never share it')}</brikka-input
      >`,
    );

    expect(projectedText(innerDescription(el))).to.equal('We never share it');
    expect(innerDescription(el).getAttribute('data-state')).to.equal(null);
    expect(
      getComputedStyle(innerDescription(el)).color,
      'a region with no state paints the muted role',
    ).to.equal(await colorOf('var(--brikka-text-muted)'));
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the error instead of the description and mark the field invalid', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input error="Required"
        >${labelAtom('Email')}${descriptionAtom('Helper')}</brikka-input
      >`,
    );

    expect(innerError(el).textContent!.trim()).to.equal('Required');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(
      getComputedStyle(innerError(el)).color,
      'the error state is the danger role the region paints',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerError(el).id);
  });

  it('should paint its field from the roles', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input
        style="--brikka-bg-surface: rgb(7, 8, 9); --brikka-border-default: rgb(1, 2, 3)"
        >${labelAtom('Email')}</brikka-input
      >`,
    );
    const style = getComputedStyle(innerInput(el));

    expect(style.backgroundColor).to.equal('rgb(7, 8, 9)');
    expect(style.borderTopColor).to.equal('rgb(1, 2, 3)');
  });

  it('should take the label colour from the text role', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);
    el.style.setProperty('--brikka-text-default', 'rgb(3, 3, 3)');

    expect(getComputedStyle(innerLabel(el)).color).to.equal('rgb(3, 3, 3)');
  });

  it('should take the disabled value from the muted role and keep the surface role', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input disabled>${labelAtom('Email')}</brikka-input>`,
    );
    el.style.setProperty('--brikka-bg-surface-muted', 'rgb(4, 4, 4)');
    el.style.setProperty('--brikka-text-muted', 'rgb(5, 5, 5)');
    const style = getComputedStyle(innerInput(el));

    expect(style.color, 'the disabled value reads the muted role').to.equal('rgb(5, 5, 5)');
    expect(style.backgroundColor, 'the surface is not repainted, muted or otherwise').to.equal(
      await colorOf('var(--brikka-bg-surface)'),
    );
    expect(style.opacity, 'the one dim is the disabled opacity').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should take the error border and message from the danger roles', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input error="Required">${labelAtom('Email')}</brikka-input>`,
    );
    el.style.setProperty('--brikka-border-danger', 'rgb(6, 6, 6)');
    el.style.setProperty('--brikka-text-danger', 'rgb(7, 7, 7)');

    expect(getComputedStyle(innerInput(el)).borderTopColor).to.equal('rgb(6, 6, 6)');
    expect(getComputedStyle(innerError(el)).color).to.equal('rgb(7, 7, 7)');
  });

  it('should keep the danger border while the invalid field is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-input error="Required">${labelAtom('Email')}</brikka-input>
        <brikka-input>${labelAtom('Email')}</brikka-input>
      </div>
    `);
    const [invalid, enabled] = host.querySelectorAll<BrikkaInput>('brikka-input');
    const field = innerInput(invalid);
    const enabledField = innerInput(enabled);
    const enabledBefore = getComputedStyle(enabledField).borderTopColor;

    await hover(enabledField);

    expect(
      enabledField.matches(':hover'),
      'the pointer reaches an enabled field, so its hover rule runs in this browser',
    ).to.equal(true);
    expect(getComputedStyle(enabledField).borderTopColor, 'and it paints that field').to.not.equal(
      enabledBefore,
    );

    await hover(field);

    expect(field.matches(':hover')).to.equal(true);
    expect(getComputedStyle(field).borderTopColor).to.equal('rgb(185, 28, 28)');
  });

  it('should pass autocomplete and inputmode through to the field', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input autocomplete="email" inputmode="email"
        >${labelAtom('Email')}</brikka-input
      >`,
    );

    expect(innerInput(el).getAttribute('autocomplete')).to.equal('email');
    expect(innerInput(el).getAttribute('inputmode')).to.equal('email');
  });

  it('should pass its type through to the inner field', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input type="email">${labelAtom('Email')}</brikka-input>`,
    );

    expect(innerInput(el).getAttribute('type')).to.equal('email');
    expect(innerInput(el).type, 'the platform resolved the type it was given').to.equal('email');
  });

  it('should pass its placeholder through to the inner field', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input placeholder="you@brikka.dev">${labelAtom('Email')}</brikka-input>`,
    );

    expect(innerInput(el).getAttribute('placeholder')).to.equal('you@brikka.dev');
    expect(innerInput(el).placeholder).to.equal('you@brikka.dev');
  });

  it('should expose the documented parts on the field it renders', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input required>${labelAtom('Email')}</brikka-input>`,
    );

    for (const name of ['label', 'input', 'required', 'message', 'description', 'error']) {
      const node = region(el, name);
      expect(Boolean(node), `the ${name} part is exposed`).to.equal(true);
      expect(node!.getAttribute('part')).to.equal(name);
    }
  });

  it('should keep the message region available to assistive tech while empty', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);
    const message = innerError(el);

    expect(message.getAttribute('role')).to.equal('status');
    expect(message.textContent!.trim()).to.equal('');
    expect(getComputedStyle(message).display).to.not.equal('none');
  });

  it('should submit with the form and restore the initial value on reset', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <brikka-input name="email" value="a@b.c">${labelAtom('Email')}</brikka-input>
      </form>`,
    );
    const field = form.querySelector('brikka-input') as BrikkaInput;
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
      html`<form>
        <brikka-input name="email" value="a@b.c">${labelAtom('Email')}</brikka-input>
      </form>`,
    );
    const field = form.querySelector('brikka-input') as BrikkaInput;
    field.value = 'changed@b.c';
    await field.updateComplete;

    form.reset();

    expect(new FormData(form).get('email')).to.equal('a@b.c');
  });

  it('should keep an author-disabled field disabled when its fieldset re-enables', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <brikka-input name="email" disabled>${labelAtom('Email')}</brikka-input>
          <brikka-input name="other"></brikka-input>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector('fieldset')!;
    const field = form.querySelector('brikka-input') as BrikkaInput;

    const plain = form.querySelectorAll('brikka-input')[1] as BrikkaInput;
    expect(innerInput(plain).disabled).to.equal(true);

    fieldset.disabled = false;
    await field.updateComplete;
    await plain.updateComplete;

    expect(field.disabled).to.equal(true);
    expect(innerInput(field).disabled).to.equal(true);
    expect(innerInput(plain).disabled).to.equal(false);
  });

  it('should disable the inner field with the native attribute, not aria-disabled', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input disabled>${labelAtom('Email')}</brikka-input>`,
    );
    const input = innerInput(el);

    expect(input.disabled).to.equal(true);
    expect(input.hasAttribute('disabled')).to.equal(true);
    expect(input.getAttribute('aria-disabled')).to.equal(null);
  });

  it('should refuse typed input while disabled', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input value="a@b.c" disabled>${labelAtom('Email')}</brikka-input>`,
    );

    el.focus();
    await sendKeys({ type: 'x' });
    await el.updateComplete;

    expect(innerInput(el).value).to.equal('a@b.c');
    expect(el.value).to.equal('a@b.c');
  });

  it('should change nothing under the pointer while the field is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-input disabled>${labelAtom('Email')}</brikka-input>
        <brikka-input>${labelAtom('Email')}</brikka-input>
      </div>
    `);
    const [disabled, enabled] = host.querySelectorAll<BrikkaInput>('brikka-input');
    const field = innerInput(disabled);
    const enabledField = innerInput(enabled);
    const borderBefore = getComputedStyle(field).borderTopColor;
    const backgroundBefore = getComputedStyle(field).backgroundColor;
    const enabledBefore = getComputedStyle(enabledField).borderTopColor;

    await hover(enabledField);

    expect(
      enabledField.matches(':hover'),
      'the pointer reaches an enabled field, so its hover rule runs in this browser',
    ).to.equal(true);
    expect(getComputedStyle(enabledField).borderTopColor, 'and it paints that field').to.not.equal(
      enabledBefore,
    );
    expect(field.matches(':hover'), 'and leaves the disabled field alone').to.equal(false);

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
    const el = await fixture<BrikkaInput>(
      html`<brikka-input disabled>${labelAtom('Email')}</brikka-input>`,
    );
    el.style.setProperty('--brikka-opacity-disabled', '0.25');

    expect(getComputedStyle(innerInput(el)).opacity, 'the control dims').to.equal('0.25');
    expect(getComputedStyle(innerLabel(el)).opacity, 'the label row dims').to.equal('0.25');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the field border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaInput>(
        html`<brikka-input>${labelAtom('Email')}</brikka-input>`,
      );
      const style = getComputedStyle(innerInput(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <brikka-input>${labelAtom('Email')}</brikka-input>
        </div>
      `);
      const el = host.querySelector<BrikkaInput>('brikka-input')!;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const style = getComputedStyle(innerInput(el));

      expect(style.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(style.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(contrastRatio(style.outlineColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the invalid border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaInput>(
        html`<brikka-input error="Required">${labelAtom('Email')}</brikka-input>`,
      );
      const style = getComputedStyle(innerInput(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the hover border at 3:1 against its own surface (${theme})`, async function () {
      if (!hoverCapable()) this.skip();

      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <brikka-input>${labelAtom('Email')}</brikka-input>
          <brikka-input>${labelAtom('Email')}</brikka-input>
        </div>
      `);
      const [el, control] = host.querySelectorAll<BrikkaInput>('brikka-input');
      const field = innerInput(el);
      const controlField = innerInput(control);
      const restingBorder = getComputedStyle(field).borderTopColor;
      const controlRestingBorder = getComputedStyle(controlField).borderTopColor;

      await hover(controlField);

      expect(controlField.matches(':hover'), 'the pointer reaches an enabled field').to.equal(true);
      expect(
        getComputedStyle(controlField).borderTopColor,
        'and repaints it, so the hover rule runs in this browser',
      ).to.not.equal(controlRestingBorder);

      await hover(field);

      expect(field.matches(':hover'), 'the pointer reaches the field').to.equal(true);
      const style = getComputedStyle(field);

      expect(
        style.borderTopColor !== restingBorder,
        'the border under the assertion is the hovered one, not the resting one',
      ).to.equal(true);
      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });
  }

  it('should render no required glyph on an optional field', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);

    expect(Boolean(innerRequired(el)), 'an optional field marks nothing').to.equal(false);
  });

  it('should mark a required field that has a label', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input required>${labelAtom('Email')}</brikka-input>`,
    );

    expect(Boolean(innerRequired(el)), 'the label carries the mark').to.equal(true);
    expect(innerRequired(el)!.textContent).to.equal('*');
    expect(
      innerRequired(el)!.closest('label') === innerLabel(el),
      'the mark lives inside the label',
    ).to.equal(true);
  });

  it('should keep the required glyph out of the accessible name', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input required>${labelAtom('Email')}</brikka-input>`,
    );

    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('should keep the native required attribute as what announces the state', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input required>${labelAtom('Email')}</brikka-input>`,
    );

    expect(innerInput(el).hasAttribute('required')).to.equal(true);
    expect(innerInput(el).required).to.equal(true);
  });

  it('should mark a required field whose label is a slotted atom', async () => {
    const el = await fixture<BrikkaInput>(html`
      <brikka-input required
        ><brikka-field-label slot="label">Email</brikka-field-label></brikka-input
      >
    `);

    expect(Boolean(innerRequired(el)), 'the slotted label is a label to mark').to.equal(true);
  });

  it('should render no glyph for a required field with no label at all', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input required></brikka-input>`);

    expect(Boolean(innerRequired(el)), 'an asterisk beside nothing marks nothing').to.equal(false);
  });

  it('should leave two steps of the space scale under the label', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);

    expect(
      getComputedStyle(innerLabel(el)).marginBlockEnd,
      '--brikka-space-2 under the label',
    ).to.equal('8px');
  });

  it('should paint the required glyph with the danger role', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input required>${labelAtom('Email')}</brikka-input>`,
    );

    expect(getComputedStyle(innerRequired(el)!).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should keep the glyph on the label line when the label is slotted', async () => {
    const el = await fixture<BrikkaInput>(html`
      <brikka-input required
        ><brikka-field-label slot="label">Email</brikka-field-label></brikka-input
      >
    `);
    const atom = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const glyph = innerRequired(el)!.getBoundingClientRect();

    expect(glyph.left, 'the glyph follows the slotted label').to.be.at.least(atom.right - 1);
    expect(glyph.top, 'the glyph shares the line with the slotted label').to.be.lessThan(
      atom.bottom,
    );
  });

  it('should paint the label danger while the field is invalid', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input error="Required">${labelAtom('Email')}</brikka-input>`,
    );

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should dim the label while the field is disabled, keeping its text role', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input disabled>${labelAtom('Email')}</brikka-input>`,
    );

    expect(
      getComputedStyle(innerLabel(el)).color,
      'the label keeps the default text role',
    ).to.equal(await colorOf('var(--brikka-text-default)'));
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should let invalid win over disabled on the label', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input error="Required" disabled>${labelAtom('Email')}</brikka-input>`,
    );

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should still dim a field that is both disabled and invalid', async () => {
    const el = await fixture<BrikkaInput>(
      html`<brikka-input error="Required" disabled>${labelAtom('Email')}</brikka-input>`,
    );
    const label = innerLabel(el);

    /* The paint is asserted and the internal `data-state` is not; `data-disabled` stays an
     * assertion because C5 documents it as the hook a consumer styles the atom on. */
    expect(getComputedStyle(label).color, 'invalid wins the state the label paints').to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
    expect(
      label.hasAttribute('data-disabled'),
      'the dim keys off disabled, which the state precedence cannot take away',
    ).to.equal(true);
    expect(getComputedStyle(label).opacity, 'the label row still dims').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
    expect(getComputedStyle(innerInput(el)).opacity, 'and so does the control').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should paint a hosted label atom with the field state', async () => {
    const el = await fixture<BrikkaInput>(html`
      <brikka-input error="Required"
        ><brikka-field-label slot="label">Email</brikka-field-label></brikka-input
      >
    `);
    const atom = el.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--brikka-text-danger)'));
  });

  it('should leave a hosted label atom undimmed while the field is disabled', async () => {
    const el = await fixture<BrikkaInput>(html`
      <brikka-input disabled
        ><brikka-field-label slot="label">Email</brikka-field-label></brikka-input
      >
    `);
    const atom = el.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(getComputedStyle(atom).color, 'the atom keeps the default text role').to.equal(
      await colorOf('var(--brikka-text-default)'),
    );
    expect(getComputedStyle(atom).opacity, 'the atom is not dimmed on top of its row').to.equal(
      '1',
    );
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row owns the one dim').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should leave a standalone label atom unpainted', async () => {
    const atom = await fixture<BrikkaFieldLabel>(
      html`<brikka-field-label>Email</brikka-field-label>`,
    );

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--brikka-text-default)'));
  });

  it('should emit brikka-change with the value, bubbling out of the shadow root', async () => {
    const el = await fixture<BrikkaInput>(html`<brikka-input>${labelAtom('Email')}</brikka-input>`);
    let received: CustomEvent<{ value: string }> | undefined;
    el.addEventListener('brikka-change', (event) => {
      received = event as CustomEvent<{ value: string }>;
    });

    const field = innerInput(el);
    field.value = 'hi@brikka.dev';
    field.dispatchEvent(new Event('change', { bubbles: true }));

    expect(received?.detail).to.deep.equal({ value: 'hi@brikka.dev' });
    expect(received?.bubbles).to.equal(true);
    expect(received?.composed).to.equal(true);
  });

  describe('field parts', () => {
    it('should take a slotted label as the control label', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-input name="email"><brikka-field-label>Email</brikka-field-label></brikka-input>
        </brikka-field>
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;

      expect(Boolean(innerLabel(input)), 'the control renders a label').to.equal(true);
      expect(innerLabel(input)!.htmlFor, 'the label points at the inner control').to.equal(
        innerInput(input).id,
      );
      expect(slottedText(input, 'label'), 'the label content is the consumer node').to.deep.equal([
        'Email',
      ]);
    });

    it('should describe the control with a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-input name="email">
            <brikka-field-label>Email</brikka-field-label>
            <brikka-field-description>We only use it for the receipt.</brikka-field-description>
          </brikka-input>
        </brikka-field>
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;

      expect(
        describedNode(innerInput(input)),
        'the description region is the description',
      ).to.equal(region(input, 'description'));
      expect(
        projectedNodes(describedNode(innerInput(input))),
        'the region projects the consumer node',
      ).to.deep.equal(['We only use it for the receipt.']);
    });

    it('should reference no description while there is no content', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-input name="email"
            ><brikka-field-label>Email</brikka-field-label></brikka-input
          ></brikka-field
        >
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;

      expect(innerInput(input).getAttribute('aria-describedby')).to.equal(null);
    });

    it('should reference no error region while the slotted error atom has no text', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-input name="email">
            <brikka-field-label>Email</brikka-field-label>
            <brikka-field-error></brikka-field-error>
          </brikka-input>
        </brikka-field>
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;
      const id = innerInput(input).getAttribute('aria-describedby');

      expect(id, 'an empty atom is not content, so nothing is referenced').to.equal(null);
      expect(
        Boolean(input.shadowRoot!.getElementById(id ?? '')),
        'the reference resolves to no node at all',
      ).to.equal(false);
      expect(innerInput(input).getAttribute('aria-invalid'), 'and it is not an error').to.equal(
        null,
      );
      expect(input.checkValidity(), 'the field stays valid').to.equal(true);
    });

    it('should keep the message region in the tree while it is empty', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-input name="email"
            ><brikka-field-label>Email</brikka-field-label></brikka-input
          ></brikka-field
        >
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;

      expect(Boolean(region(input, 'message')), 'the region stays').to.equal(true);
    });

    it('should prefer a slotted error over a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-input name="email">
            <brikka-field-label>Email</brikka-field-label>
            <brikka-field-description>We only use it for the receipt.</brikka-field-description>
            <brikka-field-error>Enter a valid address.</brikka-field-error>
          </brikka-input>
        </brikka-field>
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;

      expect(describedNode(innerInput(input)), 'the error region is the description').to.equal(
        region(input, 'error'),
      );
      expect(
        projectedNodes(describedNode(innerInput(input))),
        'the error replaces the description',
      ).to.deep.equal(['Enter a valid address.']);
      expect(
        region(input, 'description')!.hasAttribute('hidden'),
        'the description is not rendered while the error is',
      ).to.equal(true);
      expect(Boolean(region(input, 'description')), 'the description keeps its part').to.equal(
        true,
      );
    });

    it('should follow a description added after connect', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-input name="email"
            ><brikka-field-label>Email</brikka-field-label></brikka-input
          ></brikka-field
        >
      `);
      await settle(el);
      const input = el.querySelector('brikka-input') as BrikkaInput;
      expect(innerInput(input).getAttribute('aria-describedby')).to.equal(null);

      const description = document.createElement('brikka-field-description');
      description.textContent = 'Added later.';
      input.append(description);
      await settle(el);

      expect(
        describedNode(innerInput(input)),
        'the description region is the description',
      ).to.equal(region(input, 'description'));
      expect(projectedNodes(describedNode(innerInput(input)))).to.deep.equal(['Added later.']);
    });

    it('should collapse an empty region and give it space once it has content', async () => {
      const el = await fixture<BrikkaInput>(
        html`<brikka-input name="email"
          ><brikka-field-label slot="label">Email</brikka-field-label></brikka-input
        >`,
      );
      await el.updateComplete;
      const error = region(el, 'error')!;

      expect(error.isConnected, 'the region stays in the tree while empty').to.equal(true);
      expect(getComputedStyle(error).position, 'and is taken out of the flow').to.equal('absolute');
      const before = el.getBoundingClientRect().height;

      const atom = document.createElement('brikka-field-error');
      atom.slot = 'error';
      atom.textContent = 'Enter a valid address.';
      el.append(atom);
      await settle(el);

      expect(getComputedStyle(error).position, 'content brings it back into the flow').to.not.equal(
        'absolute',
      );
      expect(el.getBoundingClientRect().height, 'and the field grows').to.be.greaterThan(before);
    });

    it('should hide an empty label and show it once the atom arrives', async () => {
      const el = await fixture<BrikkaInput>(html`<brikka-input name="email"></brikka-input>`);
      await el.updateComplete;
      const label = innerLabel(el)!;

      expect(label.hasAttribute('hidden'), 'an empty label is hidden, not omitted').to.equal(true);
      expect(label.getBoundingClientRect().height, 'and takes no space').to.equal(0);

      const atom = document.createElement('brikka-field-label');
      atom.slot = 'label';
      atom.textContent = 'Email';
      el.append(atom);
      await settle(el);

      expect(label.hasAttribute('hidden'), 'the label appears with its content').to.equal(false);
      expect(label.getBoundingClientRect().height).to.be.greaterThan(0);
    });
  });

  describe('error channel', () => {
    it('should show the error instead of the native message when both exist', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-input name="email" required error="We need this address."></brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await el.updateComplete;
      await touch(el);

      expect(innerInput(el).validity.valueMissing, 'the native control is invalid').to.equal(true);
      expect(innerInput(el).validationMessage).to.not.equal('');
      expect(message(el)).to.equal('We need this address.');
      expect(innerError(el).getAttribute('data-state')).to.equal('error');
      expect(
        getComputedStyle(innerError(el)).color,
        'the error state is the danger role the region paints',
      ).to.equal(await colorOf('var(--brikka-text-danger)'));
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should show nothing and stay out of aria-invalid while an invalid field is untouched', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-input name="email" required></brikka-input></form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
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
          <brikka-input name="email" type="email" value="you@brikka.dev"></brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
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
      expect(
        getComputedStyle(innerError(el)).color,
        'the error state is the danger role the region paints',
      ).to.equal(await colorOf('var(--brikka-text-danger)'));
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should never show a native message under novalidate', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form novalidate><brikka-input name="email" required></brikka-input></form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await el.updateComplete;
      const watch = watchSubmit(form);

      await touch(el);
      form.requestSubmit();
      await el.updateComplete;

      expect(watch.count, 'novalidate lets the submit through').to.equal(1);
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
          <brikka-input name="email" required></brikka-input>
          <brikka-input name="other" value="ok" required></brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      const other = form.querySelectorAll('brikka-input')[1] as BrikkaInput;
      await el.updateComplete;
      await other.updateComplete;
      const watch = watchSubmit(form);

      form.requestSubmit();
      await el.updateComplete;
      await other.updateComplete;

      expect(watch.count).to.equal(0);
      expect(message(el)).to.equal(innerInput(el).validationMessage);
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
      expect(message(other)).to.equal('');
      expect(innerInput(other).getAttribute('aria-invalid')).to.equal(null);
    });

    it('should show the native message when a consumer reports the field explicitly', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-input name="email" required></brikka-input></form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await el.updateComplete;

      el.showValidationMessage();
      await el.updateComplete;

      expect(message(el)).to.equal(innerInput(el).validationMessage);
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should clear the error, the touched state and aria-invalid on reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-input name="email" required></brikka-input></form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
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
        <form><brikka-input name="email" type="email"></brikka-input></form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;

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
          <brikka-input name="email" value="you@brikka.dev">
            <brikka-field-error slot="error">That address looks wrong.</brikka-field-error>
          </brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await settle(el);
      const watch = watchSubmit(form);

      expect(projectedMessage(el), 'the region shows the text of the atom').to.equal(
        'That address looks wrong.',
      );
      expect(
        innerInput(el).getAttribute('aria-invalid'),
        'the atom makes the field invalid',
      ).to.equal('true');
      expect(el.validity.customError, 'the atom takes part in constraint validation').to.equal(
        true,
      );
      expect(el.validationMessage, 'with the atom text as its message').to.equal(
        'That address looks wrong.',
      );
      expect(form.checkValidity(), 'so the form refuses to validate').to.equal(false);

      form.requestSubmit();

      expect(
        watch.count,
        'and the submit is blocked like an error property would block it',
      ).to.equal(0);
    });

    it('should let the slotted atom win over the error property, and give it back', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-input name="email" value="you@brikka.dev" error="Set by the property.">
            <brikka-field-error slot="error">Set by the atom.</brikka-field-error>
          </brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await settle(el);

      expect(projectedMessage(el), 'the atom text is what the region shows').to.equal(
        'Set by the atom.',
      );
      expect(el.validationMessage, 'and the atom text is the validity message').to.equal(
        'Set by the atom.',
      );

      const atom = el.querySelector('brikka-field-error')!;
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
          <brikka-input name="email" value="you@brikka.dev">
            <brikka-field-error slot="error">Set by the atom.</brikka-field-error>
          </brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await settle(el);

      expect(el.validity.customError).to.equal(true);
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');

      const atom = el.querySelector('brikka-field-error')!;
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
          <brikka-input name="email" type="email" value="you@brikka.dev"></brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await el.updateComplete;

      await type(el, 'a@');
      expect(message(el), 'nothing is shown before the first touch').to.equal('');

      await touch(el);
      expect(message(el), 'the blur shows the native message').to.equal(
        innerInput(el).validationMessage,
      );

      await type(el, 'you@brikka.dev');

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
          <brikka-input name="email" type="email" value="you@brikka.dev"></brikka-input>
        </form>
      `);
      const el = form.querySelector('brikka-input') as BrikkaInput;
      await el.updateComplete;
      const watch = watchSubmit(form);

      const result = { success: false as const, message: 'That address looks wrong.' };
      el.error = result.success ? '' : result.message;
      await el.updateComplete;

      expect(form.checkValidity()).to.equal(false);
      expect(el.validity.customError).to.equal(true);
      expect(message(el)).to.equal('That address looks wrong.');
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
      form.requestSubmit();
      expect(watch.count).to.equal(0);

      el.value = 'changed@brikka.dev';
      await el.updateComplete;
      expect(message(el), 'a value change alone keeps the message').to.equal(
        'That address looks wrong.',
      );

      await type(el, 'changed@brikka.dev');

      expect(el.error).to.equal('');
      expect(message(el)).to.equal('');
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
      expect(form.checkValidity()).to.equal(true);
    });
  });

  describe('form participation', () => {
    it('should enter FormData under its name without a wrapper', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
      );

      expect(new FormData(form).get('email')).to.equal('a@b.c');
    });

    it('should submit the value its submittedValue holds', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;

      expect(el.submittedValue, 'the field submits what its value holds').to.equal('a@b.c');
      expect(new FormData(form).get('email')).to.equal(el.submittedValue as string);
    });

    it('should follow the typed value into FormData', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email"></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;

      await typeBubbling(el, 'typed@b.c');

      expect(new FormData(form).get('email')).to.equal('typed@b.c');
    });

    it('should submit its value with the form', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
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
        html`<form><brikka-input value="a@b.c"></brikka-input></form>`,
      );

      expect([...new FormData(form).keys()]).to.deep.equal([]);
    });

    describe('reset', () => {
      it('should restore the initial value on reset', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;
        await typeBubbling(el, 'changed@b.c');

        form.reset();
        await el.updateComplete;

        expect(el.value).to.equal('a@b.c');
        expect(new FormData(form).get('email')).to.equal('a@b.c');
      });

      it('should restore FormData and the field synchronously, before a render', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;
        await typeBubbling(el, 'changed@b.c');

        form.reset();

        expect(new FormData(form).get('email')).to.equal('a@b.c');
        expect(innerInput(el).value).to.equal('a@b.c');
      });
    });

    describe('a disabled fieldset', () => {
      it('should disable the field with its fieldset and re-enable it', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <fieldset disabled><brikka-input name="email"></brikka-input></fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector('brikka-input') as BrikkaInput;
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
              <brikka-input name="email" disabled></brikka-input>
            </fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector('brikka-input') as BrikkaInput;
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
            <brikka-input name="email" value="a@b.c" required disabled></brikka-input>
          </form>
        `);
        const el = form.querySelector('brikka-input') as BrikkaInput;
        await el.updateComplete;

        expect(new FormData(form).get('email')).to.equal(null);
        expect(el.checkValidity()).to.equal(true);
        expect(form.checkValidity()).to.equal(true);
      });

      it('should block submission with an error only while it is enabled', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <brikka-input name="email" error="That address looks wrong." disabled></brikka-input>
          </form>
        `);
        const el = form.querySelector('brikka-input') as BrikkaInput;
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
            <brikka-input
              name="email"
              value="you@brikka"
              error="That address looks wrong."
            ></brikka-input>
          </form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;
        const watch = watchSubmit(form);

        form.requestSubmit();

        expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
        expect(innerError(el).textContent!.trim()).to.equal('That address looks wrong.');
        expect(form.checkValidity()).to.equal(false);
        expect(watch.invalidOrder[0] === el, 'the field is what the submit rejected').to.equal(
          true,
        );
        expect(watch.count).to.equal(0);
      });

      it('should announce a missing required value and clear it when filled', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-input name="email" required></brikka-input></form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;
        await el.updateComplete;

        expect(form.checkValidity()).to.equal(false);

        await typeBubbling(el, 'a@b.c');

        expect(form.checkValidity()).to.equal(true);
      });

      it('should stay valid while it only has a description', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form>
            <brikka-input name="email" value="a@b.c"
              ><brikka-field-description slot="description"
                >We never share it.</brikka-field-description
              ></brikka-input
            >
          </form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;
        await el.updateComplete;

        expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
        expect(form.checkValidity()).to.equal(true);
      });
    });

    describe('the public form API', () => {
      it('should expose the form it belongs to', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-input name="email"></brikka-input></form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;

        expect(el.form === form, 'the form the field points at').to.equal(true);
      });

      it('should expose its validity and validation message', async () => {
        const el = await fixture<BrikkaInput>(
          html`<brikka-input name="email" error="That address looks wrong."></brikka-input>`,
        );

        expect(el.validity.valid).to.equal(false);
        expect(el.validity.customError).to.equal(true);
        expect(el.validationMessage).to.equal('That address looks wrong.');
      });

      it('should answer checkValidity and reportValidity', async () => {
        const el = await fixture<BrikkaInput>(
          html`<brikka-input name="email" required></brikka-input>`,
        );
        await el.updateComplete;

        expect(el.validity.valueMissing).to.equal(true);
        expect(el.checkValidity()).to.equal(false);
        expect(el.reportValidity()).to.equal(false);

        await typeBubbling(el, 'a@b.c');

        expect(el.validity.valid).to.equal(true);
        expect(el.checkValidity()).to.equal(true);
        expect(el.reportValidity()).to.equal(true);
      });

      it('should restore its value from the browser state', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
        );
        const el = form.querySelector('brikka-input') as BrikkaInput;

        el.formStateRestoreCallback('restored@b.c', 'restore');

        expect(el.value).to.equal('restored@b.c');
        expect(new FormData(form).get('email')).to.equal('restored@b.c');
      });
    });
  });

  describe('reset semantics', () => {
    it('should reset to the value attribute, not to the value it had when it mounted', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('brikka-input') as BrikkaInput;
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

    it('should read the value attribute when the reset happens, not the one it mounted with', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('brikka-input') as BrikkaInput;
      el.setAttribute('name', 'email');
      el.setAttribute('label', 'Email');
      el.setAttribute('value', 'mounted@b.c');
      form.append(el);
      await el.updateComplete;

      el.value = 'typed@b.c';
      el.setAttribute('value', 'changed@b.c');
      await el.updateComplete;

      form.reset();

      expect(el.value).to.equal('changed@b.c');
      expect(new FormData(form).get('email')).to.equal('changed@b.c');
    });
  });

  describe('platform validity', () => {
    it('should reject a value the native control rejects', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" type="email" value="nope"></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;

      expect(el.validity.typeMismatch).to.equal(true);
      expect(el.checkValidity()).to.equal(false);
    });

    it('should use the message the platform already localised', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" type="email" value="nope"></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;
      const control = el.shadowRoot!.querySelector('input')!;

      expect(el.validationMessage).to.equal(control.validationMessage);
      expect(el.validationMessage).to.not.equal('');
    });

    it('should clear a server error on reset, so the form is not stuck invalid', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" value="a@b.c"></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;
      el.error = 'That address is taken.';
      await el.updateComplete;
      expect(el.checkValidity()).to.equal(false);

      form.reset();

      expect(el.error).to.equal('');
      expect(el.checkValidity()).to.equal(true);
    });
  });

  describe('required', () => {
    it('should report a required empty field as invalid, with the platform message', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-input name="email" required></brikka-input></form>`,
      );
      const el = form.querySelector('brikka-input') as BrikkaInput;

      expect(el.validity.valueMissing).to.equal(true);
      expect(el.validationMessage).to.not.equal('');

      el.value = 'a@b.c';
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(false);
      expect(el.checkValidity()).to.equal(true);
    });
  });
});
