import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import './define.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { contrastRatio } from '../../test/helpers/contrast.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkCheckbox) => el.shadowRoot!.querySelector('label')!;
const innerBox = (el: BkCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;
const innerMessage = (el: BkCheckbox) => el.shadowRoot!.querySelector<HTMLElement>('[part="message"]')!;

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
    setTheme('light');
  });

  it('should render a label that points at the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);
    const input = innerInput(el);

    expect(innerLabel(el).htmlFor).to.equal(input.id);
    expect(input.id).to.not.equal('');
    expect(input.type).to.equal('checkbox');
    expect(input.closest('label')).to.equal(innerLabel(el));
  });

  it('should delegate focus to the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    el.focus();

    expect(el.shadowRoot!.activeElement).to.equal(innerInput(el));
  });

  it('should toggle from a click on the label text', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    innerLabel(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
  });

  it('should follow the checked property on the inner checkbox', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    el.checked = true;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(true);

    el.checked = false;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(false);
  });

  it('should dispatch bk-change with the new state, bubbling and composed', async () => {
    const host = await fixture<HTMLElement>(
      html`<div><bk-checkbox label="Accept terms"></bk-checkbox></div>`,
    );
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
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-surface)'),
    );
  });

  it('should paint the box with the accent role while checked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    el.checked = true;
    await el.updateComplete;
    await pastTransition();

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-accent)'),
    );
  });

  it('should show the check only while checked', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('hidden');

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(innerBox(el), '::after').visibility).to.equal('visible');
  });

  it('should keep the box border strong while the field is hovered', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);
    const box = innerBox(el);

    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--bk-border-default)'),
    );

    await hover(innerLabel(el));

    expect(getComputedStyle(box).borderTopColor).to.equal(
      await colorOf('var(--bk-border-strong)'),
    );
  });

  it('should draw the focus ring on the box when the field is reached by keyboard', async () => {
    const host = await fixture<HTMLElement>(html`
      <div>
        <button type="button">before</button>
        <bk-checkbox label="Accept terms"></bk-checkbox>
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
    const el = await fixture<BkCheckbox>(
      html`<bk-checkbox label="Accept terms" disabled></bk-checkbox>`,
    );
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
    const el = await fixture<BkCheckbox>(
      html`<bk-checkbox label="Accept terms" disabled></bk-checkbox>`,
    );

    expect(getComputedStyle(innerBox(el)).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-surface-muted)'),
    );
  });

  it('should reference the message region only while it has text', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(null);
    expect(innerMessage(el).textContent!.trim()).to.equal('');

    el.helper = 'You can change this later.';
    await el.updateComplete;

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerMessage(el).id);
    expect(innerMessage(el).textContent!.trim()).to.equal('You can change this later.');
  });

  it('should show the error, mark the field invalid and colour the message', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(innerMessage(el).textContent!.trim()).to.equal('You have to accept the terms.');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(getComputedStyle(innerMessage(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
    expect(getComputedStyle(innerBox(el)).borderTopColor).to.equal(
      await colorOf('var(--bk-border-danger)'),
    );
  });

  it('should colour the helper muted and keep the field valid', async () => {
    const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

    el.helper = 'We never share it.';
    await el.updateComplete;

    expect(getComputedStyle(innerMessage(el)).color).to.equal(await colorOf('var(--bk-text-muted)'));
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal(null);
  });

  it('should report a required checkbox as invalid until it is checked', async () => {
    const el = await fixture<BkCheckbox>(
      html`<bk-checkbox label="Accept terms" required></bk-checkbox>`,
    );

    expect(el.checkValidity()).to.equal(false);
    expect(el.validity.valueMissing).to.equal(true);
    expect(innerMessage(el).textContent!.trim()).to.equal('');

    el.showValidationMessage();
    await el.updateComplete;

    expect(el.fieldInvalid).to.equal(true);
    expect(innerMessage(el).textContent!.trim()).to.not.equal('');
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');

    el.checked = true;
    await el.updateComplete;

    expect(el.checkValidity()).to.equal(true);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the box boundary at 3:1 against its own surface (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);
      const style = getComputedStyle(innerBox(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the check at 3:1 against the checked box (${theme})`, async () => {
      await loadTheme(theme);
      const el = await fixture<BkCheckbox>(html`<bk-checkbox label="Accept terms"></bk-checkbox>`);

      el.checked = true;
      await el.updateComplete;
      await pastTransition();

      const box = getComputedStyle(innerBox(el));
      const check = getComputedStyle(innerBox(el), '::after');

      expect(contrastRatio(check.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against the page (${theme})`, async () => {
      await loadTheme(theme);

      expect(
        contrastRatio(await colorOf('var(--bk-focus-ring)'), await colorOf('var(--bk-bg-surface)')),
      ).to.be.at.least(3);
    });
  }
});
