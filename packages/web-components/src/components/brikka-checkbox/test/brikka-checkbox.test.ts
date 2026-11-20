import { settle } from '@brikka/test-utils/settle.js';
import { colorOf, opacityOf } from '@brikka/test-utils/style.js';
import {
  describedNode,
  projectedNodes,
  projectedText,
  region,
  slotIn,
  slottedText,
} from '@brikka/test-utils/dom.js';
import { labelAtom } from '@brikka/test-utils/atoms.js';
import { watchSubmit } from '@brikka/test-utils/form.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import '.././define.js';
import '../../brikka-field/define.js';
import type { BrikkaField } from '../../brikka-field/brikka-field.js';
import type { BrikkaFieldLabel } from '../../brikka-field/brikka-field-label.js';
import type { BrikkaCheckbox } from '.././brikka-checkbox.js';
import { contrastRatio } from '@brikka/test-utils/contrast.js';
import { expectNoViolations, expectRendered } from '@brikka/test-utils/a11y.js';
import { clickAt, hover, hoverCapable } from '@brikka/test-utils/pointer.js';
import { setTheme } from '@brikka/test-utils/theme.js';

const innerInput = (el: BrikkaCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BrikkaCheckbox) => el.shadowRoot!.querySelector('label')!;
const innerBox = (el: BrikkaCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;
const innerRequired = (el: BrikkaCheckbox) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');
const innerDescription = (el: BrikkaCheckbox) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BrikkaCheckbox) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const formData = (form: HTMLFormElement) => new FormData(form);

const assigned = (el: BrikkaCheckbox, name: string) =>
  slotIn(el, name)!.assignedElements({ flatten: true });

describe('brikka-checkbox', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BrikkaCheckbox>(
          html`<brikka-checkbox>${labelAtom('Accept terms')}</brikka-checkbox>`,
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
    document.documentElement.style.removeProperty('--brikka-checkbox-size');
    document.documentElement.style.removeProperty('--brikka-checkbox-radius');
    setTheme('light');
  });

  it('should render a label that points at the inner checkbox', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );
    const input = innerInput(el);

    expect(innerLabel(el).htmlFor).to.equal(input.id);
    expect(input.id).to.not.equal('');
    expect(input.type).to.equal('checkbox');
    expect(
      input.closest('label') === innerLabel(el),
      'the input sits inside the label that names it',
    ).to.equal(true);
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox name="terms" label="Accept terms"></brikka-checkbox>`,
    );
    await el.updateComplete;

    expect(innerLabel(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
    expect(Boolean(innerLabel(el).querySelector('.text')), 'no fallback is rendered').to.equal(
      false,
    );
  });

  it('should take a description only from the description slot, never from a helper attribute', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox name="terms" helper="You can change this later."></brikka-checkbox>`,
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

  it('should delegate focus to the inner checkbox', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.focus();

    expect(
      el.shadowRoot!.activeElement === innerInput(el),
      'focus lands on the inner input',
    ).to.equal(true);
  });

  it('should expose the documented parts on its inner elements', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox required>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    for (const name of ['label', 'input', 'box', 'required', 'message', 'description', 'error']) {
      const node = region(el, name);
      expect(Boolean(node), `the ${name} part is exposed`).to.equal(true);
      expect(node!.getAttribute('part')).to.equal(name);
    }
  });

  it('should toggle from a click on the label text', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    innerLabel(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
  });

  it('should follow the checked property on the inner checkbox', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(true);

    el.checked = false;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(false);
  });

  it('should follow the indeterminate property on the inner checkbox', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox indeterminate></brikka-checkbox>`,
    );

    expect(el.indeterminate, 'the attribute is the property').to.equal(true);
    expect(innerInput(el).indeterminate, 'the native control paints the dash').to.equal(true);

    el.indeterminate = false;
    await el.updateComplete;

    expect(el.hasAttribute('indeterminate'), 'the property is reflected').to.equal(false);
    expect(innerInput(el).indeterminate).to.equal(false);

    el.indeterminate = true;
    await el.updateComplete;

    expect(el.hasAttribute('indeterminate')).to.equal(true);
    expect(innerInput(el).indeterminate).to.equal(true);
  });

  it('should leave validity alone while it is mixed', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox indeterminate></brikka-checkbox>`,
    );

    expect(innerInput(el).validity.valid, 'mixed is not a validity state').to.equal(true);
    expect(el.validity.valid).to.equal(true);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should resolve to checked and report it when a mixed box is clicked', async () => {
    const host = await fixture<HTMLElement>(html`
      <div><brikka-checkbox indeterminate>${labelAtom('Accept terms')}</brikka-checkbox></div>
    `);
    const el = host.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    const details: unknown[] = [];
    el.addEventListener('brikka-change', (event) => {
      details.push((event as CustomEvent).detail);
    });
    await clickAt(innerBox(el));
    await el.updateComplete;

    expect(el.checked, 'the click resolves the mixed state to checked').to.equal(true);
    expect(el.indeterminate, 'the browser cleared the mixed flag, and the box mirrors it').to.equal(
      false,
    );
    expect(el.hasAttribute('indeterminate')).to.equal(false);
    expect(innerInput(el).checked).to.equal(true);
    expect(innerInput(el).indeterminate).to.equal(false);
    expect(details).to.deep.equal([{ checked: true }]);
  });

  it('should dispatch brikka-change with the new state, bubbling and composed', async () => {
    const host = await fixture<HTMLElement>(html`<div><brikka-checkbox></brikka-checkbox></div>`);
    const el = host.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    const details: unknown[] = [];
    host.addEventListener('brikka-change', (event) => {
      details.push((event as CustomEvent).detail);
    });

    innerInput(el).click();
    await el.updateComplete;

    expect(details).to.deep.equal([{ checked: true }]);
  });

  it('should paint the box with the surface role while unchecked', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--brikka-bg-surface)'),
    );
  });

  it('should paint the box with the accent role while checked', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--brikka-bg-accent)'),
    );
  });

  it('should show the check only while checked', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('hidden');

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('visible');
  });

  it('should draw the check with a stroke, not only colour it', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    const check = getComputedStyle(innerBox(el), '::after');

    expect(check.borderInlineEndWidth).to.not.equal('0px');
    expect(check.borderBlockEndWidth).to.not.equal('0px');
  });

  it('should paint a dash and not the check while it is mixed', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox indeterminate></brikka-checkbox>`,
    );

    const box = getComputedStyle(innerBox(el));
    const mixed = getComputedStyle(innerBox(el), '::after');

    expect(box.backgroundColor, 'the fill stays the accent surface').to.equal(
      await colorOf('var(--brikka-bg-accent)'),
    );
    expect(mixed.visibility, 'the mixed shape is painted').to.equal('visible');
    expect(mixed.backgroundColor, 'the dash is a filled bar in the accent text role').to.equal(
      await colorOf('var(--brikka-text-on-accent)'),
    );
    expect(mixed.borderInlineEndWidth, 'the mixed shape has no chevron stroke').to.equal('0px');
    expect(mixed.transform, 'the mixed shape is not rotated').to.equal('none');

    el.indeterminate = false;
    el.checked = true;
    await el.updateComplete;

    const check = getComputedStyle(innerBox(el), '::after');

    expect(check.visibility, 'the checkmark is painted once it is only checked').to.equal(
      'visible',
    );
    expect(check.backgroundColor, 'the checkmark is a stroke, not a filled bar').to.equal(
      'rgba(0, 0, 0, 0)',
    );
    expect(check.borderInlineEndWidth).to.not.equal('0px');
    expect(check.transform).to.not.equal('none');
  });

  it('should let the host override the box size and radius', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);
    document.documentElement.style.setProperty('--brikka-checkbox-size', '24px');
    document.documentElement.style.setProperty('--brikka-checkbox-radius', '0');
    await el.updateComplete;

    const box = getComputedStyle(innerBox(el));

    expect(box.width).to.equal('24px');
    expect(box.borderTopLeftRadius).to.equal('0px');
  });

  it('should clear the error when the box is toggled', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    innerInput(el).click();
    await el.updateComplete;

    expect(el.error).to.equal('');
  });

  it('should keep the box border strong while the field is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);
    const box = innerBox(el);

    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--brikka-border-default)'),
    );

    await hover(innerLabel(el));

    expect(innerLabel(el).matches(':hover'), 'the pointer reaches the field').to.equal(true);
    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--brikka-border-strong)'),
    );
  });

  it('should draw the focus ring on the box when the field is reached by keyboard', async () => {
    const host = await fixture<HTMLElement>(html`
      <div>
        <button type="button">before</button>
        <brikka-checkbox></brikka-checkbox>
      </div>
    `);
    const el = host.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    const box = innerBox(el);

    expect(getComputedStyle(box).outlineStyle).to.equal('none');

    (el.previousElementSibling as HTMLElement).focus();
    await sendKeys({ press: 'Tab' });
    await nextFrame();

    expect(
      el.shadowRoot!.activeElement === innerInput(el),
      'focus lands on the inner input',
    ).to.equal(true);
    expect(getComputedStyle(box).outlineStyle).to.equal('solid');
    expect(getComputedStyle(box).outlineWidth, 'the ring has a width').to.not.equal('0px');
    expect(getComputedStyle(box).outlineColor).to.equal(await colorOf('var(--brikka-focus-ring)'));
  });

  it('should draw no focus ring when the pointer focuses the box', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );
    const input = innerInput(el);

    await clickAt(innerBox(el));
    await el.updateComplete;

    expect(input.matches(':focus'), 'the click focused the inner input').to.equal(true);
    expect(input.matches(':focus-visible'), 'a pointer click is not keyboard focus').to.equal(
      false,
    );
    expect(getComputedStyle(innerBox(el)).outlineStyle, 'no ring is drawn').to.equal('none');
  });

  it('should refuse to toggle while disabled and stay focusable', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox disabled></brikka-checkbox>`);
    const input = innerInput(el);
    let changes = 0;
    el.addEventListener('brikka-change', () => {
      changes += 1;
    });

    input.click();
    await el.updateComplete;

    expect(input.getAttribute('aria-disabled')).to.equal('true');
    expect(input.hasAttribute('disabled')).to.equal(false);
    expect(input.disabled).to.equal(false);
    expect(el.checked).to.equal(false);
    expect(input.checked).to.equal(false);
    expect(changes).to.equal(0);

    el.focus();
    expect(el.shadowRoot!.activeElement === input, 'focus stays on the input').to.equal(true);
  });

  it('should dim the row of a disabled box and leave the box surface alone', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox disabled></brikka-checkbox>`);

    expect(
      getComputedStyle(innerBox(el)).backgroundColor,
      'the box keeps the surface role',
    ).to.equal(await colorOf('var(--brikka-bg-surface)'));
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should change nothing under the pointer while the box is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-checkbox disabled></brikka-checkbox>
        <brikka-checkbox></brikka-checkbox>
      </div>
    `);
    const [disabled, enabled] = host.querySelectorAll<BrikkaCheckbox>('brikka-checkbox');
    const box = innerBox(disabled);
    const enabledBox = innerBox(enabled);
    const borderBefore = getComputedStyle(box).borderTopColor;
    const backgroundBefore = getComputedStyle(box).backgroundColor;
    const enabledBefore = getComputedStyle(enabledBox).borderTopColor;

    await hover(innerLabel(enabled));

    expect(
      innerLabel(enabled).matches(':hover'),
      'the pointer reaches an enabled field, so its hover rule runs in this browser',
    ).to.equal(true);
    expect(getComputedStyle(enabledBox).borderTopColor, 'and it paints that box').to.not.equal(
      enabledBefore,
    );
    expect(innerLabel(disabled).matches(':hover'), 'and leaves the disabled box alone').to.equal(
      false,
    );

    await hover(innerLabel(disabled));

    expect(innerLabel(disabled).matches(':hover'), 'the pointer is on the disabled row').to.equal(
      true,
    );
    expect(getComputedStyle(box).borderTopColor, 'a disabled box has no hover border').to.equal(
      borderBefore,
    );
    expect(getComputedStyle(box).backgroundColor, 'nor a hover background').to.equal(
      backgroundBefore,
    );
  });

  it('should take the disabled opacity from the shared primitive', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox disabled></brikka-checkbox>`);
    el.style.setProperty('--brikka-opacity-disabled', '0.25');

    expect(getComputedStyle(innerLabel(el)).opacity).to.equal('0.25');
  });

  it('should reference the message region only while it has text', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(null);
    expect(projectedText(innerDescription(el))).to.equal('');

    const description = document.createElement('brikka-field-description');
    description.slot = 'description';
    description.textContent = 'You can change this later.';
    el.append(description);
    await settle(el);

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(projectedText(innerDescription(el))).to.equal('You can change this later.');
  });

  it('should show the error, mark the field invalid and colour the message', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(innerError(el).textContent!.trim()).to.equal('You have to accept the terms.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(getComputedStyle(innerError(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
    expect(getComputedStyle(innerBox(el)).borderTopColor).to.equal(
      await colorOf('var(--brikka-border-danger)'),
    );
  });

  it('should show the error instead of the native message when both exist', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-checkbox
          name="terms"
          required
          error="You have to accept the terms."
        ></brikka-checkbox>
      </form>
    `);
    const el = form.querySelector('brikka-checkbox') as BrikkaCheckbox;
    await el.updateComplete;
    el.showValidationMessage();
    await el.updateComplete;

    expect(innerInput(el).validity.valueMissing, 'the native control is invalid').to.equal(true);
    expect(innerInput(el).validationMessage).to.not.equal('');
    expect(innerError(el).textContent!.trim()).to.equal('You have to accept the terms.');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(
      getComputedStyle(innerError(el)).color,
      'the error state is the danger role the region paints',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should show the native message on the boxes a failed submit rejected', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-checkbox name="terms" required></brikka-checkbox>
        <brikka-checkbox name="news" required checked></brikka-checkbox>
      </form>
    `);
    const el = form.querySelector('brikka-checkbox') as BrikkaCheckbox;
    const other = form.querySelectorAll('brikka-checkbox')[1] as BrikkaCheckbox;
    await el.updateComplete;
    await other.updateComplete;
    const watch = watchSubmit(form);

    form.requestSubmit();
    await el.updateComplete;
    await other.updateComplete;

    expect(watch.invalidOrder[0] === el, 'the invalid event fires on the box that failed').to.equal(
      true,
    );
    expect(watch.count).to.equal(0);
    expect(innerError(el).textContent!.trim(), 'the native message is what shows').to.equal(
      innerInput(el).validationMessage,
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerError(other).textContent!.trim(), 'the box that passed shows nothing').to.equal('');
  });

  it('should colour the slotted description muted and keep the field valid', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox>
        <brikka-field-description slot="description">We never share it.</brikka-field-description>
      </brikka-checkbox>
    `);

    expect(getComputedStyle(innerDescription(el)).color).to.equal(
      await colorOf('var(--brikka-text-muted)'),
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should start the message block where the label text starts', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox>
        <brikka-field-label slot="label">Accept terms</brikka-field-label>
        <brikka-field-description slot="description"
          >You can change this later.</brikka-field-description
        >
      </brikka-checkbox>
    `);
    const label = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const box = innerBox(el).getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(box.left, 'the box starts the row').to.be.lessThan(label.left);
    expect(
      Math.abs(description.left - label.left),
      'the description is indented by the box and the row gap, not rendered under the box',
    ).to.be.at.most(1);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(
      Math.abs(innerError(el).getBoundingClientRect().left - label.left),
      'the error is part of the same block and indented with it',
    ).to.be.at.most(1);
  });

  it('should keep the message block aligned when the box is resized', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox>
        <brikka-field-label slot="label">Accept terms</brikka-field-label>
        <brikka-field-description slot="description"
          >You can change this later.</brikka-field-description
        >
      </brikka-checkbox>
    `);
    const before = innerDescription(el).getBoundingClientRect().left;

    el.style.setProperty('--brikka-checkbox-size', '24px');
    await el.updateComplete;

    const label = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(description.left, 'the indent follows the size hook').to.be.greaterThan(before);
    expect(
      Math.abs(description.left - label.left),
      'a resized box keeps the message block on the label text',
    ).to.be.at.most(1);
  });

  it('should report a required checkbox as invalid until it is checked', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox required></brikka-checkbox>`);

    expect(el.checkValidity()).to.equal(false);
    expect(el.validity.valueMissing).to.equal(true);
    expect(innerError(el).textContent!.trim()).to.equal('');

    el.showValidationMessage();
    await el.updateComplete;

    expect(el.fieldInvalid).to.equal(true);
    expect(innerError(el).textContent!.trim()).to.not.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');

    el.checked = true;
    await el.updateComplete;

    expect(el.checkValidity()).to.equal(true);
  });

  it('should render no required glyph on an optional box', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

    expect(Boolean(innerRequired(el)), 'an optional box marks nothing').to.equal(false);
  });

  it('should mark a required box that has a label', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox required>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    expect(Boolean(innerRequired(el)), 'the label carries the mark').to.equal(true);
    expect(innerRequired(el)!.textContent).to.equal('*');
    expect(
      innerRequired(el)!.closest('label') === innerLabel(el),
      'the mark lives inside the label',
    ).to.equal(true);
  });

  it('should keep the required glyph out of the accessible name', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox required>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('should keep the native required attribute as what announces the state', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox required></brikka-checkbox>`);

    expect(innerInput(el).hasAttribute('required')).to.equal(true);
    expect(innerInput(el).required).to.equal(true);
  });

  it('should mark a required box whose label is a slotted atom', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox required
        ><brikka-field-label slot="label">Accept terms</brikka-field-label></brikka-checkbox
      >
    `);

    expect(Boolean(innerRequired(el)), 'the slotted label is a label to mark').to.equal(true);
  });

  it('should render no glyph for a required box with no label at all', async () => {
    const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox required></brikka-checkbox>`);

    expect(Boolean(innerRequired(el)), 'an asterisk beside nothing marks nothing').to.equal(false);
  });

  it('should paint the required glyph with the danger role', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox required>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    expect(getComputedStyle(innerRequired(el)!).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should keep the glyph on the label line when the label is slotted', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox required
        ><brikka-field-label slot="label">Accept terms</brikka-field-label></brikka-checkbox
      >
    `);
    const atom = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const glyph = innerRequired(el)!.getBoundingClientRect();
    const box = el.shadowRoot!.querySelector('[part="box"]')!.getBoundingClientRect();

    expect(glyph.left, 'the glyph follows the slotted label').to.be.at.least(atom.right - 1);
    expect(glyph.top, 'the glyph sits on the row beside the box').to.be.lessThan(box.bottom);
  });

  it('should paint the label danger while the box is invalid', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should dim the label while the box is disabled, keeping its text role', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox disabled>${labelAtom('Accept terms')}</brikka-checkbox>`,
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
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox disabled>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(innerLabel(el)).color).to.equal(
      await colorOf('var(--brikka-text-danger)'),
    );
  });

  it('should still dim a box that is both disabled and invalid', async () => {
    const el = await fixture<BrikkaCheckbox>(
      html`<brikka-checkbox disabled>${labelAtom('Accept terms')}</brikka-checkbox>`,
    );

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    const label = innerLabel(el);

    expect(label.getAttribute('data-state'), 'invalid wins the state attribute').to.equal(
      'invalid',
    );
    expect(
      getComputedStyle(label).color,
      'the state the attribute names is also the role the row paints',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));
    expect(
      label.hasAttribute('data-disabled'),
      'the dim keys off disabled, which the state precedence cannot take away',
    ).to.equal(true);
    expect(getComputedStyle(label).opacity, 'the row still dims').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should paint a hosted label atom with the box state', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox
        ><brikka-field-label slot="label">Accept terms</brikka-field-label></brikka-checkbox
      >
    `);
    const atom = el.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--brikka-text-danger)'));
  });

  it('should leave a hosted label atom undimmed while the box is disabled', async () => {
    const el = await fixture<BrikkaCheckbox>(html`
      <brikka-checkbox disabled
        ><brikka-field-label slot="label">Accept terms</brikka-field-label></brikka-checkbox
      >
    `);
    const atom = el.querySelector<BrikkaFieldLabel>('brikka-field-label')!;

    expect(atom.getAttribute('data-state'), 'the atom reports the state the row paints').to.equal(
      'disabled',
    );
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

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the box boundary at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);
      const style = getComputedStyle(innerBox(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the invalid box border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

      el.error = 'You have to accept the terms.';
      await el.updateComplete;

      const box = getComputedStyle(innerBox(el));

      expect(contrastRatio(box.borderTopColor, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against the checked box (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaCheckbox>(html`<brikka-checkbox></brikka-checkbox>`);

      el.checked = true;
      await el.updateComplete;

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against a disabled box (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaCheckbox>(
        html`<brikka-checkbox checked disabled></brikka-checkbox>`,
      );

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(check.visibility).to.equal('visible');
      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should put the focus ring on the box and keep it at 3:1 (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <brikka-checkbox></brikka-checkbox>
        </div>
      `);
      const el = host.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();

      const box = getComputedStyle(innerBox(el));

      expect(box.outlineStyle).to.equal('solid');
      expect(box.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(
        contrastRatio(box.outlineColor, await colorOf('var(--brikka-bg-surface)')),
      ).to.be.at.least(3);
    });
  }

  describe('field parts', () => {
    it('should take a slotted label as the control label', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms">
            <brikka-field-label>Accept the terms</brikka-field-label>
          </brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(Boolean(innerLabel(checkbox)), 'the control renders a label').to.equal(true);
      expect(innerLabel(checkbox)!.htmlFor, 'the label points at the inner control').to.equal(
        innerInput(checkbox).id,
      );
      expect(
        Boolean(innerLabel(checkbox)!.querySelector('slot[name="label"]')),
        'the label slot lives inside the label, so the association stays implicit',
      ).to.equal(true);
      expect(assigned(checkbox, 'label')[0].localName, 'the consumer node is the atom').to.equal(
        'brikka-field-label',
      );
      expect(
        slottedText(checkbox, 'label'),
        'the label content is the consumer node',
      ).to.deep.equal(['Accept the terms']);
    });

    it('should keep the label inline beside the box and the description under it', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms">
            <brikka-field-label>Accept the terms</brikka-field-label>
            <brikka-field-description>You can change this later.</brikka-field-description>
          </brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      const box = innerBox(checkbox).getBoundingClientRect();
      const label = assigned(checkbox, 'label')[0].getBoundingClientRect();
      const description = region(checkbox, 'description')!.getBoundingClientRect();
      const middle = (rect: DOMRect) => rect.top + rect.height / 2;

      expect(
        Math.abs(middle(label) - middle(box)),
        'the label sits on the row of the box, not above it',
      ).to.be.lessThan(4);
      expect(label.left, 'the label sits to the box, not over it').to.be.greaterThan(box.right);
      expect(description.top, 'the description sits under the label row').to.be.greaterThan(
        label.bottom,
      );
      expect(
        innerLabel(checkbox)!.querySelector('[part="description"]'),
        'the description is outside the label, so it never joins the name',
      ).to.equal(null);
    });

    it('should describe the control with a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms">
            <brikka-field-label>Accept the terms</brikka-field-label>
            <brikka-field-description>You can change this later.</brikka-field-description>
          </brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(
        describedNode(innerInput(checkbox)),
        'the description region is the description',
      ).to.equal(region(checkbox, 'description'));
      expect(
        projectedNodes(describedNode(innerInput(checkbox))),
        'the region projects the consumer node',
      ).to.deep.equal(['You can change this later.']);
    });

    it('should reference no description while there is no content', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms"
            ><brikka-field-label>Accept the terms</brikka-field-label></brikka-checkbox
          >
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(innerInput(checkbox).getAttribute('aria-describedby')).to.equal(null);
    });

    it('should keep the message region in the tree while it is empty', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms"
            ><brikka-field-label>Accept the terms</brikka-field-label></brikka-checkbox
          >
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(Boolean(region(checkbox, 'message')), 'the region stays').to.equal(true);
      expect(
        region(checkbox, 'error')!.getAttribute('role'),
        'the live region keeps its role while it is empty',
      ).to.equal('status');
    });

    it('should prefer a slotted error over a slotted description', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms">
            <brikka-field-label>Accept the terms</brikka-field-label>
            <brikka-field-description>You can change this later.</brikka-field-description>
            <brikka-field-error>You have to accept the terms.</brikka-field-error>
          </brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(describedNode(innerInput(checkbox)), 'the error region is the description').to.equal(
        region(checkbox, 'error'),
      );
      expect(
        projectedNodes(describedNode(innerInput(checkbox))),
        'the error replaces the description',
      ).to.deep.equal(['You have to accept the terms.']);
      expect(
        region(checkbox, 'description')!.hasAttribute('hidden'),
        'the description is not rendered while the error is',
      ).to.equal(true);
      expect(Boolean(region(checkbox, 'description')), 'the description keeps its part').to.equal(
        true,
      );
      expect(Boolean(region(checkbox, 'error')), 'the error keeps its part').to.equal(true);
    });

    it('should follow a description added after connect', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms"
            ><brikka-field-label>Accept the terms</brikka-field-label></brikka-checkbox
          >
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;
      expect(innerInput(checkbox).getAttribute('aria-describedby')).to.equal(null);

      const description = document.createElement('brikka-field-description');
      description.textContent = 'Added later.';
      checkbox.append(description);
      await settle(el);

      expect(
        describedNode(innerInput(checkbox)),
        'the description region is the description',
      ).to.equal(region(checkbox, 'description'));
      expect(projectedNodes(describedNode(innerInput(checkbox)))).to.deep.equal(['Added later.']);
    });

    it('should take a slotted error atom as the box error and make it invalid', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms" value="accepted">
            <brikka-field-label>Accept the terms</brikka-field-label>
            <brikka-field-error>You have to accept the terms.</brikka-field-error>
          </brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(
        innerInput(checkbox).getAttribute('aria-invalid'),
        'the atom makes the box invalid',
      ).to.equal('true');
      expect(Boolean(checkbox.fieldInvalid), 'and the field reports it').to.equal(true);
      expect(checkbox.validity.customError, 'a submit is blocked by it').to.equal(true);
      expect(checkbox.validationMessage, 'with the atom text as the message').to.equal(
        'You have to accept the terms.',
      );
      expect(
        projectedNodes(region(checkbox, 'error')),
        'the atom is what the region shows',
      ).to.deep.equal(['You have to accept the terms.']);
    });

    it('should treat an empty error atom as no error at all', async () => {
      const el = await fixture<BrikkaField>(html`
        <brikka-field>
          <brikka-checkbox name="terms"
            ><brikka-field-label>Accept the terms</brikka-field-label
            ><brikka-field-error></brikka-field-error
          ></brikka-checkbox>
        </brikka-field>
      `);
      await settle(el);
      const checkbox = el.querySelector('brikka-checkbox') as BrikkaCheckbox;

      expect(
        innerInput(checkbox).getAttribute('aria-invalid'),
        'an empty atom announces no error',
      ).to.equal(null);
      expect(checkbox.validity.customError, 'and asks nothing of the form').to.equal(false);
      expect(
        innerInput(checkbox).getAttribute('aria-describedby'),
        'a region with no text is not referenced',
      ).to.equal(null);
    });
  });

  describe('form participation', () => {
    it('should submit the platform default while checked and nothing while unchecked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="accept"></brikka-checkbox>
          <brikka-checkbox name="other" checked></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

      expect(formData(form).get('accept')).to.equal(null);
      expect(formData(form).get('other')).to.equal('on');

      el.checked = true;
      await el.updateComplete;

      expect(formData(form).get('accept')).to.equal('on');
    });

    it('should submit the value property instead of the default', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="terms" value="v2" checked></brikka-checkbox>
        </form>
      `);

      expect(formData(form).get('terms')).to.equal('v2');
    });

    it('should come back unchecked when the browser restores the submitted value', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="accept" value="v2"></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector('brikka-checkbox') as BrikkaCheckbox;

      el.formStateRestoreCallback('v2', 'restore');
      await el.updateComplete;

      expect(el.value, 'the restored state lands in the submitted value').to.equal('v2');
      expect(el.checked, 'and never in the checked state').to.equal(false);
      expect(innerInput(el).checked, 'the box renders unchecked').to.equal(false);
      expect(new FormData(form).get('accept'), 'and an unchecked box submits nothing').to.equal(
        null,
      );
    });

    it('should submit nothing while it is mixed, whatever checked says', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="all" value="v2" checked indeterminate></brikka-checkbox>
          <brikka-checkbox name="plain" checked indeterminate></brikka-checkbox>
        </form>
      `);
      const all = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
      const plain = form.querySelector<BrikkaCheckbox>('[name="plain"]')!;

      expect(formData(form).get('all'), 'the mixed box is a header, not a value').to.equal(null);
      expect(formData(form).get('plain')).to.equal(null);

      all.indeterminate = false;
      plain.indeterminate = false;
      await all.updateComplete;
      await plain.updateComplete;

      expect(formData(form).get('all'), 'the value comes back once it is only checked').to.equal(
        'v2',
      );
      expect(formData(form).get('plain')).to.equal('on');
    });

    it('should keep a required mixed box valueMissing and block the submit', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="all" required indeterminate></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
      const watch = watchSubmit(form);

      expect(el.validity.valueMissing, 'nothing is submitted, so the box is missing').to.equal(
        true,
      );
      expect(el.validity.valid).to.equal(false);
      expect(form.checkValidity()).to.equal(false);
      expect(formData(form).get('all')).to.equal(null);

      form.requestSubmit();
      await el.updateComplete;

      expect(watch.count).to.equal(0);
      expect(
        watch.invalidOrder[0] === el,
        'the indeterminate box is what the submit rejected',
      ).to.equal(true);

      el.indeterminate = false;
      el.checked = true;
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(false);
      expect(form.checkValidity()).to.equal(true);
    });

    it('should restore the authored indeterminate and checked attributes on reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="all" indeterminate></brikka-checkbox>
          <brikka-checkbox name="terms" checked></brikka-checkbox>
        </form>
      `);
      const all = form.querySelector<BrikkaCheckbox>('[name="all"]')!;
      const terms = form.querySelector<BrikkaCheckbox>('[name="terms"]')!;

      innerInput(all).click();
      innerInput(terms).click();
      await all.updateComplete;
      await terms.updateComplete;

      expect(all.checked).to.equal(true);
      expect(all.indeterminate).to.equal(false);
      expect(terms.checked).to.equal(false);

      form.reset();
      await all.updateComplete;
      await terms.updateComplete;

      expect(all.indeterminate, 'the mixed state the markup declared comes back').to.equal(true);
      expect(innerInput(all).indeterminate).to.equal(true);
      expect(all.checked).to.equal(false);
      expect(innerInput(all).checked).to.equal(false);
      expect(terms.checked).to.equal(true);
      expect(innerInput(terms).checked).to.equal(true);
    });

    it('should expose the form and refuse to validate while required and unchecked', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="accept" required></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

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
          <brikka-checkbox name="accept" checked></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

      el.error = 'You have to accept the terms.';
      await el.updateComplete;

      expect(el.validity.customError).to.equal(true);
      expect(form.checkValidity()).to.equal(false);
    });

    it('should restore the authored checked attribute on reset and clear the error', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="accept" checked></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

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
          <brikka-checkbox name="accept" label="Accept terms"></brikka-checkbox>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

      innerInput(el).click();
      await el.updateComplete;

      expect(el.checked).to.equal(true);

      form.reset();
      await el.updateComplete;

      expect(el.checked).to.equal(false);
      expect(innerInput(el).checked).to.equal(false);
    });

    it('should submit nothing and report valid while it is disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <brikka-checkbox name="accept" checked disabled></brikka-checkbox>
          <brikka-checkbox name="terms" required disabled></brikka-checkbox>
        </form>
      `);

      expect(new FormData(form).get('accept')).to.equal(null);
      expect(form.checkValidity()).to.equal(true);
    });

    it('should be disabled and still focusable inside a disabled fieldset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <fieldset disabled>
            <brikka-checkbox name="accept"></brikka-checkbox>
          </fieldset>
        </form>
      `);
      const el = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;

      expect(el.fieldDisabled).to.equal(true);
      expect(innerInput(el).getAttribute('aria-disabled')).to.equal('true');

      innerInput(el).click();
      await el.updateComplete;

      expect(el.checked).to.equal(false);

      el.focus();
      expect(
        el.shadowRoot!.activeElement === innerInput(el),
        'focus lands on the inner input',
      ).to.equal(true);
    });
  });
});
