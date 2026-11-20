import { settle } from '@brikka-ui/test-utils/settle.js';
import { colorOf, opacityOf } from '@brikka-ui/test-utils/style.js';
import {
  describedNode,
  projectedNodes,
  projectedText,
  region,
  slottedText,
} from '@brikka-ui/test-utils/dom.js';
import { descriptionAtom, labelAtom } from '@brikka-ui/test-utils/atoms.js';
import { watchSubmit } from '@brikka-ui/test-utils/form.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import '.././define.js';
import '../../brikka-field/define.js';
import type { BrikkaField } from '../../brikka-field/brikka-field.js';
import type { BrikkaFieldLabel } from '../../brikka-field/brikka-field-label.js';
import type { BrikkaTextarea } from '.././brikka-textarea.js';
import { contrastRatio } from '@brikka-ui/test-utils/contrast.js';
import { expectNoViolations, expectRendered } from '@brikka-ui/test-utils/a11y.js';
import { hover, hoverCapable } from '@brikka-ui/test-utils/pointer.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

const innerTextarea = (el: BrikkaTextarea) => el.shadowRoot!.querySelector('textarea')!;
const innerLabel = (el: BrikkaTextarea) => el.shadowRoot!.querySelector('label')!;
const innerDescription = (el: BrikkaTextarea) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BrikkaTextarea) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
const innerRequired = (el: BrikkaTextarea) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');

const message = (el: BrikkaTextarea) => innerError(el).textContent!.trim();

const projectedMessage = (el: BrikkaTextarea) => projectedText(innerError(el));

/* The ids the control names, in the order it names them: the first is the one a
 * description reads, and the counter is proved to follow it rather than to stand
 * beside it. `describedNode` cannot answer for a control that names two ids, so the
 * first one is resolved here and reported by its part, never as a node: a failed
 * element comparison hangs the suite instead of naming a rule (T6). */
const describedIds = (el: BrikkaTextarea): string[] =>
  (innerTextarea(el).getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);

const firstDescribedPart = (el: BrikkaTextarea): string | null | undefined =>
  el.shadowRoot!.getElementById(describedIds(el)[0] ?? '')?.getAttribute('part');

const heightOf = (el: BrikkaTextarea): number => innerTextarea(el).getBoundingClientRect().height;

const type = async (el: BrikkaTextarea, value: string) => {
  const field = innerTextarea(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
};

// The form suite dispatched a bubbling, non-composed input event. The two helpers do
// the same work for the component's own listener, but each concern keeps the event it
// was proven with rather than one of them flattening the other.
const typeBubbling = async (el: BrikkaTextarea, value: string) => {
  const field = innerTextarea(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
};

const touch = async (el: BrikkaTextarea) => {
  const field = innerTextarea(el);
  field.focus();
  field.blur();
  await el.updateComplete;
};

describe('brikka-textarea', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BrikkaTextarea>(
          html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
        );

        await expectRendered(el, 'textarea');
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

  it('should label the textarea with a real label element', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(projectedText(innerLabel(el))).to.equal('Bio');
    expect(innerLabel(el).htmlFor).to.equal(innerTextarea(el).id);
    expect(innerTextarea(el).id).to.not.equal('');
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea name="bio" label="Bio"></brikka-textarea>`,
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
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea name="bio" helper="We never share it."></brikka-textarea>`,
    );
    await el.updateComplete;

    expect(innerDescription(el).textContent!.trim(), 'the attribute describes nothing').to.equal(
      '',
    );
    expect(
      innerTextarea(el).getAttribute('aria-describedby'),
      'a region with no content is not referenced',
    ).to.equal(null);
  });

  it('should take the label weight from the shared typography token', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );
    document.documentElement.style.setProperty('--brikka-font-weight-medium', '700');

    expect(getComputedStyle(innerLabel(el)).fontWeight).to.equal('700');
  });

  it('should describe the textarea with the slotted description and stay valid', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea
        >${labelAtom('Bio')}${descriptionAtom('We never share it')}</brikka-textarea
      >`,
    );

    expect(projectedText(innerDescription(el))).to.equal('We never share it');
    expect(innerDescription(el).getAttribute('data-state')).to.equal(null);
    expect(
      getComputedStyle(innerDescription(el)).color,
      'a region with no state paints the muted role',
    ).to.equal(await colorOf('var(--brikka-text-muted)'));
    expect(innerTextarea(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should show the error instead of the description and mark the field invalid', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea error="Required"
        >${labelAtom('Bio')}${descriptionAtom('Helper')}</brikka-textarea
      >`,
    );

    expect(innerError(el).textContent!.trim()).to.equal('Required');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(
      getComputedStyle(innerError(el)).color,
      'the error state is the danger role the region paints',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));
    expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerTextarea(el).getAttribute('aria-describedby')).to.equal(innerError(el).id);
  });

  it('should paint its field from the roles', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea
        style="--brikka-bg-surface: rgb(7, 8, 9); --brikka-border-default: rgb(1, 2, 3)"
        >${labelAtom('Bio')}</brikka-textarea
      >`,
    );
    const style = getComputedStyle(innerTextarea(el));

    expect(style.backgroundColor).to.equal('rgb(7, 8, 9)');
    expect(style.borderTopColor).to.equal('rgb(1, 2, 3)');
  });

  it('should take the label colour from the text role', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );
    el.style.setProperty('--brikka-text-default', 'rgb(3, 3, 3)');

    expect(getComputedStyle(innerLabel(el)).color).to.equal('rgb(3, 3, 3)');
  });

  it('should take the disabled value from the muted role and keep the surface role', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea disabled>${labelAtom('Bio')}</brikka-textarea>`,
    );
    el.style.setProperty('--brikka-bg-surface-muted', 'rgb(4, 4, 4)');
    el.style.setProperty('--brikka-text-muted', 'rgb(5, 5, 5)');
    const style = getComputedStyle(innerTextarea(el));

    expect(style.color, 'the disabled value reads the muted role').to.equal('rgb(5, 5, 5)');
    expect(style.backgroundColor, 'the surface is not repainted, muted or otherwise').to.equal(
      await colorOf('var(--brikka-bg-surface)'),
    );
    expect(style.opacity, 'the one dim is the disabled opacity').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should take the error border and message from the danger roles', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea error="Required">${labelAtom('Bio')}</brikka-textarea>`,
    );
    el.style.setProperty('--brikka-border-danger', 'rgb(6, 6, 6)');
    el.style.setProperty('--brikka-text-danger', 'rgb(7, 7, 7)');

    expect(getComputedStyle(innerTextarea(el)).borderTopColor).to.equal('rgb(6, 6, 6)');
    expect(getComputedStyle(innerError(el)).color).to.equal('rgb(7, 7, 7)');
  });

  it('should keep the danger border while the invalid field is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-textarea error="Required">${labelAtom('Bio')}</brikka-textarea>
        <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
      </div>
    `);
    const [invalid, enabled] = host.querySelectorAll<BrikkaTextarea>('brikka-textarea');
    const field = innerTextarea(invalid);
    const enabledField = innerTextarea(enabled);
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

  it('should pass autocomplete through to the field', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea autocomplete="off">${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(innerTextarea(el).getAttribute('autocomplete')).to.equal('off');
  });

  it('should pass its placeholder through to the inner field', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea placeholder="Tell us a little about yourself."
        >${labelAtom('Bio')}
      </brikka-textarea>`,
    );

    expect(innerTextarea(el).getAttribute('placeholder')).to.equal(
      'Tell us a little about yourself.',
    );
    expect(innerTextarea(el).placeholder).to.equal('Tell us a little about yourself.');
  });

  it('should expose the documented parts on the field it renders', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea required maxlength="20">${labelAtom('Bio')}</brikka-textarea>`,
    );

    for (const name of [
      'label',
      'textarea',
      'required',
      'message',
      'description',
      'error',
      'counter',
    ]) {
      const node = region(el, name);
      expect(Boolean(node), `the ${name} part is exposed`).to.equal(true);
      expect(node!.getAttribute('part')).to.equal(name);
    }
  });

  it('should keep the message region available to assistive tech while empty', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );
    const message = innerError(el);

    expect(message.getAttribute('role')).to.equal('status');
    expect(message.textContent!.trim()).to.equal('');
    expect(getComputedStyle(message).display).to.not.equal('none');
  });

  it('should submit with the form and restore the initial value on reset', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <brikka-textarea name="bio" value="Hello">${labelAtom('Bio')}</brikka-textarea>
      </form>`,
    );
    const field = form.querySelector('brikka-textarea') as BrikkaTextarea;
    await field.updateComplete;

    expect(new FormData(form).get('bio')).to.equal('Hello');

    field.value = 'Changed';
    await field.updateComplete;
    expect(new FormData(form).get('bio')).to.equal('Changed');

    form.reset();
    await field.updateComplete;
    expect(field.value).to.equal('Hello');
  });

  it('should clear the submitted value on reset without waiting a render', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <brikka-textarea name="bio" value="Hello">${labelAtom('Bio')}</brikka-textarea>
      </form>`,
    );
    const field = form.querySelector('brikka-textarea') as BrikkaTextarea;
    field.value = 'Changed';
    await field.updateComplete;

    form.reset();

    expect(new FormData(form).get('bio')).to.equal('Hello');
  });

  it('should keep an author-disabled field disabled when its fieldset re-enables', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <brikka-textarea name="bio" disabled>${labelAtom('Bio')}</brikka-textarea>
          <brikka-textarea name="other"></brikka-textarea>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector('fieldset')!;
    const field = form.querySelector('brikka-textarea') as BrikkaTextarea;

    const plain = form.querySelectorAll('brikka-textarea')[1] as BrikkaTextarea;
    expect(innerTextarea(plain).disabled).to.equal(true);

    fieldset.disabled = false;
    await field.updateComplete;
    await plain.updateComplete;

    expect(field.disabled).to.equal(true);
    expect(innerTextarea(field).disabled).to.equal(true);
    expect(innerTextarea(plain).disabled).to.equal(false);
  });

  it('should disable the inner field with the native attribute, not aria-disabled', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea disabled>${labelAtom('Bio')}</brikka-textarea>`,
    );
    const control = innerTextarea(el);

    expect(control.disabled).to.equal(true);
    expect(control.hasAttribute('disabled')).to.equal(true);
    expect(control.getAttribute('aria-disabled')).to.equal(null);
  });

  it('should refuse typed input while disabled', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea value="Hello" disabled>${labelAtom('Bio')}</brikka-textarea>`,
    );

    el.focus();
    await sendKeys({ type: 'x' });
    await el.updateComplete;

    expect(innerTextarea(el).value).to.equal('Hello');
    expect(el.value).to.equal('Hello');
  });

  it('should change nothing under the pointer while the field is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-textarea disabled>${labelAtom('Bio')}</brikka-textarea>
        <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
      </div>
    `);
    const [disabled, enabled] = host.querySelectorAll<BrikkaTextarea>('brikka-textarea');
    const field = innerTextarea(disabled);
    const enabledField = innerTextarea(enabled);
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
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea disabled>${labelAtom('Bio')}</brikka-textarea>`,
    );
    el.style.setProperty('--brikka-opacity-disabled', '0.25');

    expect(getComputedStyle(innerTextarea(el)).opacity, 'the control dims').to.equal('0.25');
    expect(getComputedStyle(innerLabel(el)).opacity, 'the label row dims').to.equal('0.25');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the field border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
      );
      const style = getComputedStyle(innerTextarea(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
        </div>
      `);
      const el = host.querySelector<BrikkaTextarea>('brikka-textarea')!;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const style = getComputedStyle(innerTextarea(el));

      expect(style.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(style.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(contrastRatio(style.outlineColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the invalid border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea error="Required">${labelAtom('Bio')}</brikka-textarea>`,
      );
      const style = getComputedStyle(innerTextarea(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the hover border at 3:1 against its own surface (${theme})`, async function () {
      if (!hoverCapable()) this.skip();

      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
          <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
        </div>
      `);
      const [el, control] = host.querySelectorAll<BrikkaTextarea>('brikka-textarea');
      const field = innerTextarea(el);
      const controlField = innerTextarea(control);
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
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(Boolean(innerRequired(el)), 'an optional field marks nothing').to.equal(false);
  });

  it('should mark a required field that has a label', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea required>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(Boolean(innerRequired(el)), 'the label carries the mark').to.equal(true);
    expect(innerRequired(el)!.textContent).to.equal('*');
    expect(
      innerRequired(el)!.closest('label') === innerLabel(el),
      'the mark lives inside the label',
    ).to.equal(true);
  });

  it('should keep the required glyph out of the accessible name', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea required>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('should keep the native required attribute as what announces the state', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea required>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(innerTextarea(el).hasAttribute('required')).to.equal(true);
    expect(innerTextarea(el).required).to.equal(true);
  });

  it('should mark a required field whose label is a slotted atom', async () => {
    const el = await fixture<BrikkaTextarea>(html`
      <brikka-textarea required
        ><brikka-field-label slot="label">Bio</brikka-field-label></brikka-textarea
      >
    `);

    expect(Boolean(innerRequired(el)), 'the slotted label is a label to mark').to.equal(true);
  });

  it('should render no glyph for a required field with no label at all', async () => {
    const el = await fixture<BrikkaTextarea>(html`<brikka-textarea required></brikka-textarea>`);

    expect(Boolean(innerRequired(el)), 'an asterisk beside nothing marks nothing').to.equal(false);
  });

  it('should leave two steps of the space scale under the label', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(
      getComputedStyle(innerLabel(el)).marginBlockEnd,
      '--brikka-space-2 under the label',
    ).to.equal('8px');
  });

  it('should paint the required glyph with the danger role', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea required>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(getComputedStyle(innerRequired(el)!).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should keep the glyph on the label line when the label is slotted', async () => {
    const el = await fixture<BrikkaTextarea>(html`
      <brikka-textarea required
        ><brikka-field-label slot="label">Bio</brikka-field-label></brikka-textarea
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
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea error="Required">${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should dim the label while the field is disabled, keeping its text role', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea disabled>${labelAtom('Bio')}</brikka-textarea>`,
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
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea error="Required" disabled>${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should still dim a field that is both disabled and invalid', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea error="Required" disabled>${labelAtom('Bio')}</brikka-textarea>`,
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
    expect(getComputedStyle(innerTextarea(el)).opacity, 'and so does the control').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should paint a hosted label atom with the field state', async () => {
    const el = await fixture<BrikkaTextarea>(html`
      <brikka-textarea error="Required"
        ><brikka-field-label slot="label">Bio</brikka-field-label></brikka-textarea
      >
    `);
    const atom = el.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--brikka-text-danger)'));
  });

  it('should leave a hosted label atom undimmed while the field is disabled', async () => {
    const el = await fixture<BrikkaTextarea>(html`
      <brikka-textarea disabled
        ><brikka-field-label slot="label">Bio</brikka-field-label></brikka-textarea
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
      html`<brikka-field-label>Bio</brikka-field-label>`,
    );

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--brikka-text-default)'));
  });

  it('should emit brikka-change with the value, bubbling out of the shadow root', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea>${labelAtom('Bio')}</brikka-textarea>`,
    );
    let received: CustomEvent<{ value: string }> | undefined;
    el.addEventListener('brikka-change', (event) => {
      received = event as CustomEvent<{ value: string }>;
    });

    const field = innerTextarea(el);
    field.value = 'Hello\nthere';
    field.dispatchEvent(new Event('change', { bubbles: true }));

    expect(received?.detail).to.deep.equal({ value: 'Hello\nthere' });
    expect(received?.bubbles).to.equal(true);
    expect(received?.composed).to.equal(true);
  });

  describe('the height', () => {
    it('should pass rows through to the inner textarea and be sized by them', async () => {
      const host = await fixture<HTMLElement>(html`
        <div>
          <brikka-textarea rows="8">${labelAtom('Bio')}</brikka-textarea>
          <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
        </div>
      `);
      const [eight, four] = host.querySelectorAll<BrikkaTextarea>('brikka-textarea');

      expect(innerTextarea(four).getAttribute('rows'), 'four rows is the default').to.equal('4');
      expect(innerTextarea(four).rows).to.equal(4);
      expect(innerTextarea(eight).getAttribute('rows')).to.equal('8');
      expect(innerTextarea(eight).rows).to.equal(8);

      const line = parseFloat(getComputedStyle(innerTextarea(eight)).lineHeight);
      expect(
        heightOf(eight) - heightOf(four),
        'the four extra rows are four extra lines of height',
      ).to.be.closeTo(4 * line, line / 2);
    });

    it('should map resize none and its vertical default to the CSS property', async () => {
      const host = await fixture<HTMLElement>(html`
        <div>
          <brikka-textarea resize="none">${labelAtom('Bio')}</brikka-textarea>
          <brikka-textarea>${labelAtom('Bio')}</brikka-textarea>
        </div>
      `);
      const [none, vertical] = host.querySelectorAll<BrikkaTextarea>('brikka-textarea');

      expect(getComputedStyle(innerTextarea(none)).resize, 'none is no handle').to.equal('none');
      expect(vertical.resize, 'vertical is the default this field declares').to.equal('vertical');
      expect(getComputedStyle(innerTextarea(vertical)).resize).to.equal('vertical');
    });

    it('should render no manual handle when resize is auto', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea resize="auto">${labelAtom('Bio')}</brikka-textarea>`,
      );

      expect(getComputedStyle(innerTextarea(el)).resize, 'the field sizes itself').to.equal('none');
    });

    it('should grow with the text and give the height back when the text shrinks', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea resize="auto" rows="2">${labelAtom('Bio')}</brikka-textarea>`,
      );
      const control = innerTextarea(el);
      const empty = heightOf(el);

      await type(el, 'line\n'.repeat(12));

      expect(heightOf(el), 'the field grew with its text').to.be.greaterThan(empty);
      expect(control.scrollHeight, 'a field sized to its content keeps no scrollbar').to.be.at.most(
        control.clientHeight,
      );

      const grown = heightOf(el);
      await type(el, '');

      expect(heightOf(el), 'the height is not frozen at the grown one').to.be.lessThan(grown);
      expect(heightOf(el), 'and the empty field takes its own height back').to.be.closeTo(empty, 1);
      expect(control.scrollHeight).to.be.at.most(control.clientHeight);
    });

    it('should measure again for a value set as a property, not only for a keystroke', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea resize="auto" rows="2">${labelAtom('Bio')}</brikka-textarea>`,
      );
      const empty = heightOf(el);

      el.value = 'line\n'.repeat(12);
      await el.updateComplete;

      expect(heightOf(el), 'the programmatic value is measured too').to.be.greaterThan(empty);
      expect(innerTextarea(el).scrollHeight).to.be.at.most(innerTextarea(el).clientHeight);
    });
  });

  describe('the counter', () => {
    it('should render no counter without maxlength', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea value="Hello">${labelAtom('Bio')}</brikka-textarea>`,
      );

      expect(Boolean(region(el, 'counter')), 'no bound, no count').to.equal(false);
      expect(innerTextarea(el).hasAttribute('maxlength')).to.equal(false);
      expect(describedIds(el), 'and nothing enters the description the field names').to.deep.equal(
        [],
      );
    });

    it('should count the value against maxlength', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea maxlength="20" value="Hello">${labelAtom('Bio')}</brikka-textarea>`,
      );
      const counter = region(el, 'counter');

      expect(counter!.textContent!.trim(), 'value.length over maxlength').to.equal(
        `${String(el.value).length} / ${el.maxlength}`,
      );
      expect(counter!.textContent!.trim()).to.equal('5 / 20');
      expect(
        innerTextarea(el).getAttribute('maxlength'),
        'the bound reaches the platform',
      ).to.equal('20');
      expect(counter!.getAttribute('role'), 'the count is announced').to.equal('status');
    });

    it('should follow the value as the user types', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea maxlength="20">${labelAtom('Bio')}</brikka-textarea>`,
      );
      expect(region(el, 'counter')!.textContent!.trim()).to.equal('0 / 20');

      await type(el, 'Hello there');

      expect(region(el, 'counter')!.textContent!.trim()).to.equal('11 / 20');
    });

    it('should name the counter behind the description', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea maxlength="20" value="Hello"
          >${labelAtom('Bio')}${descriptionAtom('We never share it')}</brikka-textarea
        >`,
      );

      expect(
        describedIds(el),
        'the description is the description and the counter follows it',
      ).to.deep.equal([region(el, 'description')!.id, region(el, 'counter')!.id]);
      /* Two ids, so the first is the one a description reads: naming the region by its
       * part is what proves the order the ids carry. */
      expect(firstDescribedPart(el), 'the description is what is read first').to.equal(
        'description',
      );
    });

    it('should name the counter behind the error that displaced the description', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea maxlength="20" value="Hello" error="Required"
          >${labelAtom('Bio')}${descriptionAtom('We never share it')}</brikka-textarea
        >`,
      );

      expect(
        describedIds(el),
        'the error wins the first place and the counter still follows',
      ).to.deep.equal([region(el, 'error')!.id, region(el, 'counter')!.id]);
      expect(firstDescribedPart(el), 'so the error is what is read first').to.equal('error');
      expect(firstDescribedPart(el)).to.equal(region(el, 'error')!.getAttribute('part'));
      expect(
        Boolean(region(el, 'description')),
        'the description keeps its part while the error is read',
      ).to.equal(true);
    });

    it('should take the counter away with the bound', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea maxlength="20" value="Hello"
          >${labelAtom('Bio')}${descriptionAtom('We never share it')}</brikka-textarea
        >`,
      );

      el.maxlength = 0;
      await el.updateComplete;

      expect(Boolean(region(el, 'counter')), 'a bound of zero is no bound').to.equal(false);
      expect(
        innerTextarea(el).hasAttribute('maxlength'),
        'and nothing reaches the platform',
      ).to.equal(false);
      expect(describedIds(el), 'the description is all that is named').to.deep.equal([
        region(el, 'description')!.id,
      ]);
    });

    it('should share the row with the help text, help left and count right', async () => {
      const el = await fixture<BrikkaTextarea>(html`
        <brikka-textarea maxlength="20" value="Hello">
          ${labelAtom('Bio')}
          <brikka-field-description>Tell us more.</brikka-field-description>
        </brikka-textarea>
      `);

      const counter = region(el, 'counter')!;
      const row = counter.parentElement!;
      const regions = row.querySelector('.regions')!;

      expect(getComputedStyle(row).display, 'the count and the regions are one flex row').to.equal(
        'flex',
      );
      expect(
        Boolean(regions.querySelector('slot[name="description"]')),
        'the help text is projected inside that row, not above it',
      ).to.equal(true);
      expect(
        Boolean(counter.compareDocumentPosition(regions) & Node.DOCUMENT_POSITION_PRECEDING),
        'the count follows the help, so it paints on the right',
      ).to.equal(true);
    });

    it('should keep that row when the error takes the help text away', async () => {
      const el = await fixture<BrikkaTextarea>(html`
        <brikka-textarea maxlength="20" value="Hello" error="Too short."
          >${labelAtom('Bio')}</brikka-textarea
        >
      `);

      const counter = region(el, 'counter')!;
      const row = counter.parentElement!;

      expect(
        getComputedStyle(row).display,
        'the error does not give the count a row of its own',
      ).to.equal('flex');
      expect(
        row.querySelector('.regions')!.contains(region(el, 'error')),
        'and the error is the other half of the same row',
      ).to.equal(true);
    });
  });

  it('should pass minlength through to the inner field, and only while it bounds', async () => {
    const el = await fixture<BrikkaTextarea>(
      html`<brikka-textarea minlength="10">${labelAtom('Bio')}</brikka-textarea>`,
    );

    expect(innerTextarea(el).getAttribute('minlength')).to.equal('10');
    expect(innerTextarea(el).minLength).to.equal(10);

    el.minlength = 0;
    await el.updateComplete;

    expect(innerTextarea(el).hasAttribute('minlength'), 'zero is no bound').to.equal(false);
  });

  describe('field parts', () => {
    it('should take a slotted label as the control label', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-textarea name="bio"><brikka-field-label>Bio</brikka-field-label></brikka-textarea>
        </brikka-field>
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(Boolean(innerLabel(textarea)), 'the control renders a label').to.equal(true);
      expect(innerLabel(textarea)!.htmlFor, 'the label points at the inner control').to.equal(
        innerTextarea(textarea).id,
      );
      expect(
        slottedText(textarea, 'label'),
        'the label content is the consumer node',
      ).to.deep.equal(['Bio']);
    });

    it('should describe the control with a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-textarea name="bio">
            <brikka-field-label>Bio</brikka-field-label>
            <brikka-field-description>We only use it for the receipt.</brikka-field-description>
          </brikka-textarea>
        </brikka-field>
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(
        describedNode(innerTextarea(textarea)),
        'the description region is the description',
      ).to.equal(region(textarea, 'description'));
      expect(
        projectedNodes(describedNode(innerTextarea(textarea))),
        'the region projects the consumer node',
      ).to.deep.equal(['We only use it for the receipt.']);
    });

    it('should reference no description while there is no content', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-textarea name="bio"
            ><brikka-field-label>Bio</brikka-field-label></brikka-textarea
          ></brikka-field
        >
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(innerTextarea(textarea).getAttribute('aria-describedby')).to.equal(null);
    });

    it('should reference no error region while the slotted error atom has no text', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-textarea name="bio">
            <brikka-field-label>Bio</brikka-field-label>
            <brikka-field-error></brikka-field-error>
          </brikka-textarea>
        </brikka-field>
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;
      const id = innerTextarea(textarea).getAttribute('aria-describedby');

      expect(id, 'an empty atom is not content, so nothing is referenced').to.equal(null);
      expect(
        Boolean(textarea.shadowRoot!.getElementById(id ?? '')),
        'the reference resolves to no node at all',
      ).to.equal(false);
      expect(
        innerTextarea(textarea).getAttribute('aria-invalid'),
        'and it is not an error',
      ).to.equal(null);
      expect(textarea.checkValidity(), 'the field stays valid').to.equal(true);
    });

    it('should keep the message region in the tree while it is empty', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-textarea name="bio"
            ><brikka-field-label>Bio</brikka-field-label></brikka-textarea
          ></brikka-field
        >
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(Boolean(region(textarea, 'message')), 'the region stays').to.equal(true);
    });

    it('should prefer a slotted error over a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-textarea name="bio">
            <brikka-field-label>Bio</brikka-field-label>
            <brikka-field-description>We only use it for the receipt.</brikka-field-description>
            <brikka-field-error>Say a little more.</brikka-field-error>
          </brikka-textarea>
        </brikka-field>
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(
        describedNode(innerTextarea(textarea)),
        'the error region is the description',
      ).to.equal(region(textarea, 'error'));
      expect(
        projectedNodes(describedNode(innerTextarea(textarea))),
        'the error replaces the description',
      ).to.deep.equal(['Say a little more.']);
      expect(
        region(textarea, 'description')!.hasAttribute('hidden'),
        'the description is not rendered while the error is',
      ).to.equal(true);
      expect(Boolean(region(textarea, 'description')), 'the description keeps its part').to.equal(
        true,
      );
    });

    it('should follow a description added after connect', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field
          ><brikka-textarea name="bio"
            ><brikka-field-label>Bio</brikka-field-label></brikka-textarea
          ></brikka-field
        >
      `);
      await settle(el);
      const textarea = el.querySelector('brikka-textarea') as BrikkaTextarea;
      expect(innerTextarea(textarea).getAttribute('aria-describedby')).to.equal(null);

      const description = document.createElement('brikka-field-description');
      description.textContent = 'Added later.';
      textarea.append(description);
      await settle(el);

      expect(
        describedNode(innerTextarea(textarea)),
        'the description region is the description',
      ).to.equal(region(textarea, 'description'));
      expect(projectedNodes(describedNode(innerTextarea(textarea)))).to.deep.equal([
        'Added later.',
      ]);
    });

    it('should collapse an empty region and give it space once it has content', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea name="bio"
          ><brikka-field-label slot="label">Bio</brikka-field-label></brikka-textarea
        >`,
      );
      await el.updateComplete;
      const error = region(el, 'error')!;

      expect(error.isConnected, 'the region stays in the tree while empty').to.equal(true);
      expect(getComputedStyle(error).position, 'and is taken out of the flow').to.equal('absolute');
      const before = el.getBoundingClientRect().height;

      const atom = document.createElement('brikka-field-error');
      atom.slot = 'error';
      atom.textContent = 'Say a little more.';
      el.append(atom);
      await settle(el);

      expect(getComputedStyle(error).position, 'content brings it back into the flow').to.not.equal(
        'absolute',
      );
      expect(el.getBoundingClientRect().height, 'and the field grows').to.be.greaterThan(before);
    });

    it('should hide an empty label and show it once the atom arrives', async () => {
      const el = await fixture<BrikkaTextarea>(
        html`<brikka-textarea name="bio"></brikka-textarea>`,
      );
      await el.updateComplete;
      const label = innerLabel(el)!;

      expect(label.hasAttribute('hidden'), 'an empty label is hidden, not omitted').to.equal(true);
      expect(label.getBoundingClientRect().height, 'and takes no space').to.equal(0);

      const atom = document.createElement('brikka-field-label');
      atom.slot = 'label';
      atom.textContent = 'Bio';
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
          <brikka-textarea name="bio" required error="We need this."></brikka-textarea>
        </form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;
      await touch(el);

      expect(innerTextarea(el).validity.valueMissing, 'the native control is invalid').to.equal(
        true,
      );
      expect(innerTextarea(el).validationMessage).to.not.equal('');
      expect(message(el)).to.equal('We need this.');
      expect(innerError(el).getAttribute('data-state')).to.equal('error');
      expect(
        getComputedStyle(innerError(el)).color,
        'the error state is the danger role the region paints',
      ).to.equal(await colorOf('var(--brikka-text-danger)'));
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should show nothing and stay out of aria-invalid while an invalid field is untouched', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;
      el.requestUpdate();
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(true);
      expect(el.fieldMessage).to.equal('');
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
    });

    it('should show the native message after a blur and never while typing', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" value="Hello" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;

      await type(el, '');
      expect(innerTextarea(el).validity.valueMissing).to.equal(true);
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);

      const native = innerTextarea(el).validationMessage;
      expect(native).to.not.equal('');

      await touch(el);

      expect(message(el)).to.equal(native);
      expect(innerError(el).getAttribute('data-state')).to.equal('error');
      expect(
        getComputedStyle(innerError(el)).color,
        'the error state is the danger role the region paints',
      ).to.equal(await colorOf('var(--brikka-text-danger)'));
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should never show a native message under novalidate', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form novalidate><brikka-textarea name="bio" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;
      const watch = watchSubmit(form);

      await touch(el);
      form.requestSubmit();
      await el.updateComplete;

      expect(watch.count, 'novalidate lets the submit through').to.equal(1);
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);

      el.error = 'We need this.';
      await el.updateComplete;

      expect(message(el)).to.equal('We need this.');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should show the native message only on the fields a failed submit rejected', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-textarea name="bio" required></brikka-textarea>
          <brikka-textarea name="other" value="ok" required></brikka-textarea>
        </form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      const other = form.querySelectorAll('brikka-textarea')[1] as BrikkaTextarea;
      await el.updateComplete;
      await other.updateComplete;
      const watch = watchSubmit(form);

      form.requestSubmit();
      await el.updateComplete;
      await other.updateComplete;

      expect(watch.count).to.equal(0);
      expect(message(el)).to.equal(innerTextarea(el).validationMessage);
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
      expect(message(other)).to.equal('');
      expect(innerTextarea(other).getAttribute('aria-invalid')).to.equal(null);
    });

    it('should show the native message when a consumer reports the field explicitly', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;

      el.showValidationMessage();
      await el.updateComplete;

      expect(message(el)).to.equal(innerTextarea(el).validationMessage);
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should clear the error, the touched state and aria-invalid on reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      el.error = 'That message was already sent.';
      await el.updateComplete;
      await touch(el);

      expect(message(el)).to.equal('That message was already sent.');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');

      form.reset();
      await el.updateComplete;

      expect(el.error).to.equal('');
      expect(el.validity.valueMissing, 'the reset field is still natively invalid').to.equal(true);
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
    });

    it('should not mark the field touched when the browser restores a value', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      el.formStateRestoreCallback('', 'restore');
      el.requestUpdate();
      await el.updateComplete;

      expect(el.value).to.equal('');
      expect(el.validity.valueMissing).to.equal(true);
      expect(el.fieldMessage).to.equal('');
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
    });

    it('should take a slotted error atom as the field error', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-textarea name="bio" value="Hello">
            <brikka-field-error slot="error">Say a little more.</brikka-field-error>
          </brikka-textarea>
        </form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await settle(el);
      const watch = watchSubmit(form);

      expect(projectedMessage(el), 'the region shows the text of the atom').to.equal(
        'Say a little more.',
      );
      expect(
        innerTextarea(el).getAttribute('aria-invalid'),
        'the atom makes the field invalid',
      ).to.equal('true');
      expect(el.validity.customError, 'the atom takes part in constraint validation').to.equal(
        true,
      );
      expect(el.validationMessage, 'with the atom text as its message').to.equal(
        'Say a little more.',
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
          <brikka-textarea name="bio" value="Hello" error="Set by the property.">
            <brikka-field-error slot="error">Set by the atom.</brikka-field-error>
          </brikka-textarea>
        </form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
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
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should follow the text of the slotted atom while the field sits there', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-textarea name="bio" value="Hello">
            <brikka-field-error slot="error">Set by the atom.</brikka-field-error>
          </brikka-textarea>
        </form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await settle(el);

      expect(el.validity.customError).to.equal(true);
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');

      const atom = el.querySelector('brikka-field-error')!;
      atom.textContent = '';
      await settle(el);

      expect(el.checkValidity(), 'emptying the atom makes the field valid').to.equal(true);
      expect(el.validity.customError).to.equal(false);
      expect(el.validationMessage).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);

      atom.textContent = 'Back again.';
      await settle(el);

      expect(el.checkValidity(), 'and refilling it makes it invalid again').to.equal(false);
      expect(el.validationMessage).to.equal('Back again.');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should follow the value on the next keystroke once the field has been touched', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" value="Hello" required></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;

      await type(el, '');
      expect(message(el), 'nothing is shown before the first touch').to.equal('');

      await touch(el);
      expect(message(el), 'the blur shows the native message').to.equal(
        innerTextarea(el).validationMessage,
      );

      await type(el, 'Hello');

      expect(message(el), 'the next keystroke drops the message the value fixed').to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);

      await type(el, '');

      expect(message(el), 'and a broken value brings it back while typing').to.equal(
        innerTextarea(el).validationMessage,
      );
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should block submission for an error a schema result set, until the user acts', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      await el.updateComplete;
      const watch = watchSubmit(form);

      const result = { success: false as const, message: 'Say a little more.' };
      el.error = result.success ? '' : result.message;
      await el.updateComplete;

      expect(form.checkValidity()).to.equal(false);
      expect(el.validity.customError).to.equal(true);
      expect(message(el)).to.equal('Say a little more.');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
      form.requestSubmit();
      expect(watch.count).to.equal(0);

      el.value = 'Changed';
      await el.updateComplete;
      expect(message(el), 'a value change alone keeps the message').to.equal('Say a little more.');

      await type(el, 'Changed');

      expect(el.error).to.equal('');
      expect(message(el)).to.equal('');
      expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
      expect(form.checkValidity()).to.equal(true);
    });
  });

  describe('form participation', () => {
    it('should enter FormData under its name without a wrapper', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
      );

      expect(new FormData(form).get('bio')).to.equal('Hello');
    });

    it('should submit the value its submittedValue holds', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(el.submittedValue, 'the field submits what its value holds').to.equal('Hello');
      expect(new FormData(form).get('bio')).to.equal(el.submittedValue as string);
    });

    it('should follow the typed value into FormData', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio"></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      await typeBubbling(el, 'Typed\nwith a break');

      expect(new FormData(form).get('bio')).to.equal('Typed\nwith a break');
    });

    it('should submit its value with the form', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
      );
      let submitted: FormData | undefined;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitted = new FormData(form);
      });

      form.requestSubmit();

      expect(submitted?.get('bio')).to.equal('Hello');
    });

    it('should not enter FormData when it has no name', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea value="Hello"></brikka-textarea></form>`,
      );

      expect([...new FormData(form).keys()]).to.deep.equal([]);
    });

    describe('reset', () => {
      it('should restore the initial value on reset', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await typeBubbling(el, 'Changed');

        form.reset();
        await el.updateComplete;

        expect(el.value).to.equal('Hello');
        expect(new FormData(form).get('bio')).to.equal('Hello');
      });

      it('should restore FormData and the field synchronously, before a render', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await typeBubbling(el, 'Changed');

        form.reset();

        expect(new FormData(form).get('bio')).to.equal('Hello');
        expect(innerTextarea(el).value).to.equal('Hello');
      });
    });

    describe('a disabled fieldset', () => {
      it('should disable the field with its fieldset and re-enable it', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <fieldset disabled><brikka-textarea name="bio"></brikka-textarea></fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await nextFrame();
        await el.updateComplete;

        expect(innerTextarea(el).disabled).to.equal(true);
        expect(innerTextarea(el).getAttribute('aria-disabled')).to.equal(null);

        fieldset.disabled = false;
        await nextFrame();
        await el.updateComplete;

        expect(innerTextarea(el).disabled).to.equal(false);
      });

      it('should keep an author-disabled field disabled when its fieldset re-enables', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <fieldset disabled>
              <brikka-textarea name="bio" disabled></brikka-textarea>
            </fieldset>
          </form>
        `);
        const fieldset = form.querySelector('fieldset')!;
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await nextFrame();
        await el.updateComplete;

        fieldset.disabled = false;
        await nextFrame();
        await el.updateComplete;

        expect(el.disabled).to.equal(true);
        expect(innerTextarea(el).disabled).to.equal(true);
        expect(innerTextarea(el).getAttribute('aria-disabled')).to.equal(null);
      });

      it('should submit nothing and report valid while disabled', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <brikka-textarea name="bio" value="Hello" required disabled></brikka-textarea>
          </form>
        `);
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await el.updateComplete;

        expect(new FormData(form).get('bio')).to.equal(null);
        expect(el.checkValidity()).to.equal(true);
        expect(form.checkValidity()).to.equal(true);
      });

      it('should block submission with an error only while it is enabled', async () => {
        const form = await fixture<HTMLFormElement>(html`
          <form>
            <brikka-textarea name="bio" error="Say a little more." disabled></brikka-textarea>
          </form>
        `);
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
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
            <brikka-textarea name="bio" value="Hello" error="Say a little more."></brikka-textarea>
          </form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        const watch = watchSubmit(form);

        form.requestSubmit();

        expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal('true');
        expect(innerError(el).textContent!.trim()).to.equal('Say a little more.');
        expect(form.checkValidity()).to.equal(false);
        expect(watch.invalidOrder[0] === el, 'the field is what the submit rejected').to.equal(
          true,
        );
        expect(watch.count).to.equal(0);
      });

      it('should announce a missing required value and clear it when filled', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-textarea name="bio" required></brikka-textarea></form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await el.updateComplete;

        expect(form.checkValidity()).to.equal(false);

        await typeBubbling(el, 'Hello');

        expect(form.checkValidity()).to.equal(true);
      });

      it('should stay valid while it only has a description', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form>
            <brikka-textarea name="bio" value="Hello"
              ><brikka-field-description slot="description"
                >We never share it.</brikka-field-description
              ></brikka-textarea
            >
          </form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
        await el.updateComplete;

        expect(innerTextarea(el).getAttribute('aria-invalid')).to.equal(null);
        expect(form.checkValidity()).to.equal(true);
      });
    });

    describe('the public form API', () => {
      it('should expose the form it belongs to', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-textarea name="bio"></brikka-textarea></form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

        expect(el.form === form, 'the form the field points at').to.equal(true);
      });

      it('should expose its validity and validation message', async () => {
        const el = await fixture<BrikkaTextarea>(
          html`<brikka-textarea name="bio" error="Say a little more."></brikka-textarea>`,
        );

        expect(el.validity.valid).to.equal(false);
        expect(el.validity.customError).to.equal(true);
        expect(el.validationMessage).to.equal('Say a little more.');
      });

      it('should answer checkValidity and reportValidity', async () => {
        const el = await fixture<BrikkaTextarea>(
          html`<brikka-textarea name="bio" required></brikka-textarea>`,
        );
        await el.updateComplete;

        expect(el.validity.valueMissing).to.equal(true);
        expect(el.checkValidity()).to.equal(false);
        expect(el.reportValidity()).to.equal(false);

        await typeBubbling(el, 'Hello');

        expect(el.validity.valid).to.equal(true);
        expect(el.checkValidity()).to.equal(true);
        expect(el.reportValidity()).to.equal(true);
      });

      it('should restore its value from the browser state', async () => {
        const form = await fixture<HTMLFormElement>(
          html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
        );
        const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

        el.formStateRestoreCallback('Restored', 'restore');

        expect(el.value).to.equal('Restored');
        expect(new FormData(form).get('bio')).to.equal('Restored');
      });
    });
  });

  describe('reset semantics', () => {
    it('should reset to the value attribute, not to the value it had when it mounted', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('brikka-textarea') as BrikkaTextarea;
      el.setAttribute('name', 'bio');
      el.setAttribute('label', 'Bio');
      el.setAttribute('value', 'Default');
      el.value = 'Start';
      form.append(el);
      await el.updateComplete;

      form.reset();

      expect(el.value).to.equal('Default');
      expect(new FormData(form).get('bio')).to.equal('Default');
    });

    it('should read the value attribute when the reset happens, not the one it mounted with', async () => {
      const form = await fixture<HTMLFormElement>(html`<form></form>`);
      const el = document.createElement('brikka-textarea') as BrikkaTextarea;
      el.setAttribute('name', 'bio');
      el.setAttribute('label', 'Bio');
      el.setAttribute('value', 'Mounted');
      form.append(el);
      await el.updateComplete;

      el.value = 'Typed';
      el.setAttribute('value', 'Changed');
      await el.updateComplete;

      form.reset();

      expect(el.value).to.equal('Changed');
      expect(new FormData(form).get('bio')).to.equal('Changed');
    });
  });

  describe('platform validity', () => {
    it('should reject a value the native control rejects', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" required></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(el.validity.valueMissing).to.equal(true);
      expect(el.checkValidity()).to.equal(false);
      expect(el.validity.valid, 'the element reports the anchor validity it was given').to.equal(
        innerTextarea(el).validity.valid,
      );
    });

    it('should use the message the platform already localised', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" required></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      const control = innerTextarea(el);

      expect(el.validationMessage).to.equal(control.validationMessage);
      expect(el.validationMessage).to.not.equal('');
    });

    it('should clear a server error on reset, so the form is not stuck invalid', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-textarea name="bio" value="Hello"></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      el.error = 'That message was already sent.';
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
        html`<form><brikka-textarea name="bio" required></brikka-textarea></form>`,
      );
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      expect(el.validity.valueMissing).to.equal(true);
      expect(el.validationMessage).to.not.equal('');

      el.value = 'Hello';
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(false);
      expect(el.checkValidity()).to.equal(true);
    });
  });

  describe('a bounded value', () => {
    it('should keep the platform from accepting more than maxlength', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" maxlength="5"></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;
      const control = innerTextarea(el);

      control.focus();
      await sendKeys({ type: 'abcdefgh' });
      await el.updateComplete;

      expect(el.value, 'the platform cut the value at the bound').to.equal('abcde');
      expect(region(el, 'counter')!.textContent!.trim()).to.equal('5 / 5');
      expect(el.checkValidity()).to.equal(true);
    });

    it('should report a value shorter than minlength once the user typed it', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><brikka-textarea name="bio" minlength="5"></brikka-textarea></form>
      `);
      const el = form.querySelector('brikka-textarea') as BrikkaTextarea;

      innerTextarea(el).focus();
      await sendKeys({ type: 'ab' });
      await el.updateComplete;

      expect(el.value).to.equal('ab');
      expect(el.validity.tooShort, 'the platform reports the short value').to.equal(true);
      expect(el.checkValidity()).to.equal(false);
    });
  });
});
