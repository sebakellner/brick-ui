import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import './define.js';
import '../bk-field/define.js';
import type { BkFieldLabel } from '../bk-field/bk-field-label.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { contrastRatio } from '../../test/helpers/contrast.js';
import { clickAt, hover, hoverCapable } from '../../test/helpers/pointer.js';
import { setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkCheckbox) => el.shadowRoot!.querySelector('label')!;
const innerBox = (el: BkCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;
const innerRequired = (el: BkCheckbox) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');
const innerDescription = (el: BkCheckbox) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BkCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const labelAtom = html`<bk-field-label slot="label">Accept terms</bk-field-label>`;

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

describe('bk-checkbox', () => {
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--bk-checkbox-size');
    document.documentElement.style.removeProperty('--bk-checkbox-radius');
    setTheme('light');
  });

  it('should render a label that points at the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox>${labelAtom}</bk-checkbox>`);
    const input = innerInput(el);

    expect(innerLabel(el).htmlFor).to.equal(input.id);
    expect(input.id).to.not.equal('');
    expect(input.type).to.equal('checkbox');
    expect(input.closest('label')).to.equal(innerLabel(el));
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BkCheckbox>(
      html`<bk-checkbox name="terms" label="Accept terms"></bk-checkbox>`,
    );
    await el.updateComplete;

    expect(innerLabel(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
    expect(Boolean(innerLabel(el).querySelector('.text')), 'no fallback is rendered').to.equal(
      false,
    );
  });

  it('should take a description only from the description slot, never from a helper attribute', async () => {
    const el = await fixture<BkCheckbox>(
      html`<bk-checkbox name="terms" helper="You can change this later."></bk-checkbox>`,
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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.focus();

    expect(el.shadowRoot!.activeElement).to.equal(innerInput(el));
  });

  it('should toggle from a click on the label text', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox>${labelAtom}</bk-checkbox>`);

    innerLabel(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
  });

  it('should follow the checked property on the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(true);

    el.checked = false;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(false);
  });

  it('should follow the indeterminate property on the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox indeterminate></bk-checkbox>`);

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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox indeterminate></bk-checkbox>`);

    expect(innerInput(el).validity.valid, 'mixed is not a validity state').to.equal(true);
    expect(el.validity.valid).to.equal(true);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should resolve to checked and report it when a mixed box is clicked', async () => {
    const host = await fixture<HTMLElement>(html`
      <div><bk-checkbox indeterminate>${labelAtom}</bk-checkbox></div>
    `);
    const el = host.querySelector<BkCheckbox>('bk-checkbox')!;
    const details: unknown[] = [];
    el.addEventListener('bk-change', (event) => {
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

  it('should dispatch bk-change with the new state, bubbling and composed', async () => {
    const host = await fixture<HTMLElement>(html`<div><bk-checkbox></bk-checkbox></div>`);
    const el = host.querySelector<BkCheckbox>('bk-checkbox')!;
    const details: unknown[] = [];
    host.addEventListener('bk-change', (event) => {
      details.push((event as CustomEvent).detail);
    });

    innerInput(el).click();
    await el.updateComplete;

    expect(details).to.deep.equal([{ checked: true }]);
  });

  it('should paint the box with the surface role while unchecked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-surface)'),
    );
  });

  it('should paint the box with the accent role while checked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-accent)'),
    );
  });

  it('should show the check only while checked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('hidden');

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('visible');
  });

  it('should draw the check with a stroke, not only colour it', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    const check = getComputedStyle(innerBox(el), '::after');

    expect(check.borderInlineEndWidth).to.not.equal('0px');
    expect(check.borderBlockEndWidth).to.not.equal('0px');
  });

  it('should paint a dash and not the check while it is mixed', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox indeterminate></bk-checkbox>`);

    const box = getComputedStyle(innerBox(el));
    const mixed = getComputedStyle(innerBox(el), '::after');

    expect(box.backgroundColor, 'the fill stays the accent surface').to.equal(
      await colorOf('var(--bk-bg-accent)'),
    );
    expect(mixed.visibility, 'the mixed shape is painted').to.equal('visible');
    expect(mixed.backgroundColor, 'the dash is a filled bar in the accent text role').to.equal(
      await colorOf('var(--bk-text-on-accent)'),
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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);
    document.documentElement.style.setProperty('--bk-checkbox-size', '24px');
    document.documentElement.style.setProperty('--bk-checkbox-radius', '0');
    await el.updateComplete;

    const box = getComputedStyle(innerBox(el));

    expect(box.width).to.equal('24px');
    expect(box.borderTopLeftRadius).to.equal('0px');
  });

  it('should clear the error when the box is toggled', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    innerInput(el).click();
    await el.updateComplete;

    expect(el.error).to.equal('');
  });

  it('should keep the box border strong while the field is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);
    const box = innerBox(el);

    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--bk-border-default)'),
    );

    await hover(innerLabel(el));

    expect(innerLabel(el).matches(':hover'), 'the pointer reaches the field').to.equal(true);
    expect(getComputedStyle(box).borderTopColor).to.equal(await colorOf('var(--bk-border-strong)'));
  });

  it('should draw the focus ring on the box when the field is reached by keyboard', async () => {
    const host = await fixture<HTMLElement>(html`
      <div>
        <button type="button">before</button>
        <bk-checkbox></bk-checkbox>
      </div>
    `);
    const el = host.querySelector<BkCheckbox>('bk-checkbox')!;
    const box = innerBox(el);

    expect(getComputedStyle(box).outlineStyle).to.equal('none');

    (el.previousElementSibling as HTMLElement).focus();
    await sendKeys({ press: 'Tab' });
    await nextFrame();

    expect(el.shadowRoot!.activeElement).to.equal(innerInput(el));
    expect(getComputedStyle(box).outlineStyle).to.equal('solid');
    expect(getComputedStyle(box).outlineColor).to.equal(await colorOf('var(--bk-focus-ring)'));
  });

  it('should refuse to toggle while disabled and stay focusable', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled></bk-checkbox>`);
    const input = innerInput(el);
    let changes = 0;
    el.addEventListener('bk-change', () => {
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
    expect(el.shadowRoot!.activeElement).to.equal(input);
  });

  it('should dim the row of a disabled box and leave the box surface alone', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled></bk-checkbox>`);

    expect(
      getComputedStyle(innerBox(el)).backgroundColor,
      'the box keeps the surface role',
    ).to.equal(await colorOf('var(--bk-bg-surface)'));
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should change nothing under the pointer while the box is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <bk-checkbox disabled></bk-checkbox>
        <bk-checkbox></bk-checkbox>
      </div>
    `);
    const [disabled, enabled] = host.querySelectorAll<BkCheckbox>('bk-checkbox');
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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled></bk-checkbox>`);
    el.style.setProperty('--bk-opacity-disabled', '0.25');

    expect(getComputedStyle(innerLabel(el)).opacity).to.equal('0.25');
  });

  it('should reference the message region only while it has text', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(null);
    expect(projectedText(innerDescription(el))).to.equal('');

    const description = document.createElement('bk-field-description');
    description.slot = 'description';
    description.textContent = 'You can change this later.';
    el.append(description);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(projectedText(innerDescription(el))).to.equal('You can change this later.');
  });

  it('should show the error, mark the field invalid and colour the message', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(innerError(el).textContent!.trim()).to.equal('You have to accept the terms.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(getComputedStyle(innerError(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
    expect(getComputedStyle(innerBox(el)).borderTopColor).to.equal(
      await colorOf('var(--bk-border-danger)'),
    );
  });

  it('should show the error instead of the native message when both exist', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" required error="You have to accept the terms."></bk-checkbox>
      </form>
    `);
    const el = form.querySelector('bk-checkbox') as BkCheckbox;
    await el.updateComplete;
    el.showValidationMessage();
    await el.updateComplete;

    expect(innerInput(el).validity.valueMissing, 'the native control is invalid').to.equal(true);
    expect(innerInput(el).validationMessage).to.not.equal('');
    expect(innerError(el).textContent!.trim()).to.equal('You have to accept the terms.');
    expect(innerError(el).getAttribute('data-state')).to.equal('error');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('should show the native message on the boxes a failed submit rejected', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" required></bk-checkbox>
        <bk-checkbox name="news" required checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector('bk-checkbox') as BkCheckbox;
    const other = form.querySelectorAll('bk-checkbox')[1] as BkCheckbox;
    await el.updateComplete;
    await other.updateComplete;
    let submitted = false;
    let invalidOn: EventTarget | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });
    form.addEventListener('invalid', (event) => (invalidOn = event.target), true);

    form.requestSubmit();
    await el.updateComplete;
    await other.updateComplete;

    expect(invalidOn, 'the invalid event fires on the box that failed').to.equal(el);
    expect(submitted).to.equal(false);
    expect(innerError(el).textContent!.trim(), 'the native message is what shows').to.equal(
      innerInput(el).validationMessage,
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(innerError(other).textContent!.trim(), 'the box that passed shows nothing').to.equal('');
  });

  it('should colour the slotted description muted and keep the field valid', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox>
        <bk-field-description slot="description">We never share it.</bk-field-description>
      </bk-checkbox>
    `);

    expect(getComputedStyle(innerDescription(el)).color).to.equal(
      await colorOf('var(--bk-text-muted)'),
    );
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should start the message block where the label text starts', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox>
        <bk-field-label slot="label">Accept terms</bk-field-label>
        <bk-field-description slot="description">You can change this later.</bk-field-description>
      </bk-checkbox>
    `);
    const label = el.querySelector('bk-field-label')!.getBoundingClientRect();
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
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox>
        <bk-field-label slot="label">Accept terms</bk-field-label>
        <bk-field-description slot="description">You can change this later.</bk-field-description>
      </bk-checkbox>
    `);
    const before = innerDescription(el).getBoundingClientRect().left;

    el.style.setProperty('--bk-checkbox-size', '24px');
    await el.updateComplete;

    const label = el.querySelector('bk-field-label')!.getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(description.left, 'the indent follows the size hook').to.be.greaterThan(before);
    expect(
      Math.abs(description.left - label.left),
      'a resized box keeps the message block on the label text',
    ).to.be.at.most(1);
  });

  it('should report a required checkbox as invalid until it is checked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required></bk-checkbox>`);

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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

    expect(Boolean(innerRequired(el)), 'an optional box marks nothing').to.equal(false);
  });

  it('should mark a required box that has a label', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required>${labelAtom}</bk-checkbox>`);

    expect(innerRequired(el), 'the label carries the mark').to.not.equal(null);
    expect(innerRequired(el)!.textContent).to.equal('*');
    expect(innerRequired(el)!.closest('label'), 'the mark lives inside the label').to.equal(
      innerLabel(el),
    );
  });

  it('should keep the required glyph out of the accessible name', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required>${labelAtom}</bk-checkbox>`);

    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('should keep the native required attribute as what announces the state', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required></bk-checkbox>`);

    expect(innerInput(el).hasAttribute('required')).to.equal(true);
    expect(innerInput(el).required).to.equal(true);
  });

  it('should mark a required box whose label is a slotted atom', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox required><bk-field-label slot="label">Accept terms</bk-field-label></bk-checkbox>
    `);

    expect(innerRequired(el), 'the slotted label is a label to mark').to.not.equal(null);
  });

  it('should render no glyph for a required box with no label at all', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required></bk-checkbox>`);

    expect(Boolean(innerRequired(el)), 'an asterisk beside nothing marks nothing').to.equal(false);
  });

  it('should paint the required glyph with the danger role', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox required>${labelAtom}</bk-checkbox>`);

    expect(getComputedStyle(innerRequired(el)!).color).to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
  });

  it('should keep the glyph on the label line when the label is slotted', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox required><bk-field-label slot="label">Accept terms</bk-field-label></bk-checkbox>
    `);
    const atom = el.querySelector('bk-field-label')!.getBoundingClientRect();
    const glyph = innerRequired(el)!.getBoundingClientRect();
    const box = el.shadowRoot!.querySelector('[part="box"]')!.getBoundingClientRect();

    expect(glyph.left, 'the glyph follows the slotted label').to.be.at.least(atom.right - 1);
    expect(glyph.top, 'the glyph sits on the row beside the box').to.be.lessThan(box.bottom);
  });

  it('should paint the label danger while the box is invalid', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox>${labelAtom}</bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should dim the label while the box is disabled, keeping its text role', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled>${labelAtom}</bk-checkbox>`);

    expect(
      getComputedStyle(innerLabel(el)).color,
      'the label keeps the default text role',
    ).to.equal(await colorOf('var(--bk-text-default)'));
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should let invalid win over disabled on the label', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled>${labelAtom}</bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should still dim a box that is both disabled and invalid', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled>${labelAtom}</bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    const label = innerLabel(el);

    expect(label.getAttribute('data-state'), 'invalid wins the state attribute').to.equal(
      'invalid',
    );
    expect(
      label.hasAttribute('data-disabled'),
      'the dim keys off disabled, which the state precedence cannot take away',
    ).to.equal(true);
    expect(getComputedStyle(label).opacity, 'the row still dims').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
  });

  it('should paint a hosted label atom with the box state', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox><bk-field-label slot="label">Accept terms</bk-field-label></bk-checkbox>
    `);
    const atom = el.querySelector<BkFieldLabel>('bk-field-label')!;

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--bk-text-danger)'));
  });

  it('should leave a hosted label atom undimmed while the box is disabled', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox disabled><bk-field-label slot="label">Accept terms</bk-field-label></bk-checkbox>
    `);
    const atom = el.querySelector<BkFieldLabel>('bk-field-label')!;

    expect(atom.getAttribute('data-state'), 'the atom reports the state the row paints').to.equal(
      'disabled',
    );
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

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the box boundary at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);
      const style = getComputedStyle(innerBox(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against the checked box (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

      el.checked = true;
      await el.updateComplete;

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against a disabled box (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox checked disabled></bk-checkbox>`);

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
          <bk-checkbox></bk-checkbox>
        </div>
      `);
      const el = host.querySelector<BkCheckbox>('bk-checkbox')!;

      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();

      const box = getComputedStyle(innerBox(el));

      expect(box.outlineStyle).to.equal('solid');
      expect(contrastRatio(box.outlineColor, await colorOf('var(--bk-bg-surface)'))).to.be.at.least(
        3,
      );
    });
  }
});
