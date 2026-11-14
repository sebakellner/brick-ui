import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import './define.js';
import '../bk-field/define.js';
import type { BkFieldLabel } from '../bk-field/bk-field-label.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { contrastRatio } from '../../test/helpers/contrast.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

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

const pastTransition = async () => {
  await nextFrame();
  await new Promise((resolve) => setTimeout(resolve, 250));
};

const hover = async (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  await sendMouse({
    type: 'move',
    position: [Math.round(x + width / 2), Math.round(y + height / 2)],
  });
  await pastTransition();
};

const colorOf = async (value: string): Promise<string> => {
  const probe = await fixture<HTMLElement>(html`<span style="color: ${value}"></span>`);

  return getComputedStyle(probe).color;
};

describe('bk-checkbox', () => {
  before(loadTheme);

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
    expect(innerLabel(el).querySelector('.text'), 'no fallback is rendered').to.equal(null);
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
    await pastTransition();

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

  it('should keep the box border strong while the field is hovered', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);
    const box = innerBox(el);

    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--bk-border-default)'),
    );

    await hover(innerLabel(el));

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

  it('should paint the box muted while disabled', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled></bk-checkbox>`);

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-surface-muted)'),
    );
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

    expect(innerRequired(el), 'an optional box marks nothing').to.equal(null);
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

    expect(innerRequired(el), 'an asterisk beside nothing marks nothing').to.equal(null);
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

  it('should paint the label muted while the box is disabled', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled>${labelAtom}</bk-checkbox>`);

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-muted)'));
  });

  it('should let invalid win over disabled on the label', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox disabled>${labelAtom}</bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(getComputedStyle(innerLabel(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
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

  it('should paint a hosted label atom muted while the box is disabled', async () => {
    const el = await fixture<BkCheckbox>(html`
      <bk-checkbox disabled><bk-field-label slot="label">Accept terms</bk-field-label></bk-checkbox>
    `);
    const atom = el.querySelector<BkFieldLabel>('bk-field-label')!;

    expect(getComputedStyle(atom).color).to.equal(await colorOf('var(--bk-text-muted)'));
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the box boundary at 3:1 against its own surface (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);
      const style = getComputedStyle(innerBox(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against the checked box (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox></bk-checkbox>`);

      el.checked = true;
      await el.updateComplete;
      await pastTransition();

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against a disabled box (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox checked disabled></bk-checkbox>`);
      await pastTransition();

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(check.visibility).to.equal('visible');
      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should put the focus ring on the box and keep it at 3:1 (${theme})`, async () => {
      await loadTheme(theme);
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
