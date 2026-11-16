import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '.././define.js';
import type { BkButton } from '.././bk-button.js';
import { contrastRatio } from '../../../test/helpers/contrast.js';
import { expectNoViolations } from '../../../test/helpers/a11y.js';
import { colorOf } from '../../../test/helpers/style.js';
import { hover, hoverCapable } from '../../../test/helpers/pointer.js';
import { setTheme } from '../../../test/helpers/theme.js';
import { sendKeys, resetMouse } from '@web/test-runner-commands';

const innerButton = (el: BkButton) => el.shadowRoot!.querySelector('button')!;

const mount = (variant?: string) =>
  fixture<BkButton>(
    variant
      ? html`<bk-button variant=${variant}>Save</bk-button>`
      : html`<bk-button>Save</bk-button>`,
  );

describe('bk-button', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`should have no accessibility violations (${theme})`, async () => {
      setTheme(theme);
      const primary = await mount();

      await expectNoViolations(primary);
    });
  }
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    for (const prop of [
      '--bk-button-bg',
      '--bk-bg-accent',
      '--bk-bg-surface',
      '--bk-border-default',
      '--bk-text-default',
      '--bk-text-on-accent',
      '--bk-button-disabled-opacity',
      '--bk-opacity-disabled',
      '--bk-font-weight-medium',
      'font-family',
    ]) {
      document.documentElement.style.removeProperty(prop);
      document.body.style.removeProperty(prop);
    }
    setTheme('light');
  });

  it('should default to the primary variant, reflected on the host', async () => {
    const button = await mount();

    expect(button.variant).to.equal('primary');
    expect(button.getAttribute('variant')).to.equal('primary');
    expect(innerButton(button).getAttribute('part')).to.equal('button');
  });

  it('should mark a disabled button as unavailable without dropping it from the tab order', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));

    innerButton(button).click();

    expect(innerButton(button).getAttribute('aria-disabled')).to.equal('true');
    expect(innerButton(button).disabled).to.equal(false);
    expect(clicks).to.equal(0);

    button.focus();
    expect(
      button.shadowRoot!.activeElement === innerButton(button),
      'focus lands on the inner button',
    ).to.equal(true);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep its label readable on the accent background (${theme})`, async () => {
      setTheme(theme);
      const primary = await mount();
      const style = getComputedStyle(innerButton(primary));

      expect(contrastRatio(style.color, style.backgroundColor)).to.be.at.least(4.5);
    });

    it(`should keep the secondary border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const secondary = await mount('secondary');
      const style = getComputedStyle(innerButton(secondary));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against the surface it sits on (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <bk-button>Save</bk-button>
        </div>
      `);
      const el = host.querySelector<BkButton>('bk-button')!;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const style = getComputedStyle(innerButton(el));

      expect(style.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(style.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(
        contrastRatio(style.outlineColor, await colorOf('var(--bk-bg-surface)')),
      ).to.be.at.least(3);
    });
  }

  it('should let a public custom property win over the variant default', async () => {
    const ghost = await mount('ghost');
    ghost.style.setProperty('--bk-button-bg', 'rgb(1, 2, 3)');

    expect(getComputedStyle(innerButton(ghost)).backgroundColor).to.equal('rgb(1, 2, 3)');
  });

  it('should let an inherited public property win over the variant default', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-button-bg', 'rgb(9, 9, 9)');

    expect(getComputedStyle(innerButton(primary)).backgroundColor).to.equal('rgb(9, 9, 9)');
    expect(getComputedStyle(innerButton(secondary)).backgroundColor).to.equal('rgb(9, 9, 9)');
  });

  it('should map the default variant and a named variant to their roles', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-bg-accent', 'rgb(4, 5, 6)');
    document.documentElement.style.setProperty('--bk-bg-surface', 'rgb(7, 8, 9)');

    expect(getComputedStyle(innerButton(primary)).backgroundColor).to.equal('rgb(4, 5, 6)');
    expect(getComputedStyle(innerButton(secondary)).backgroundColor).to.equal('rgb(7, 8, 9)');
  });

  it('should take its typography from the token instead of inheriting the page font', async () => {
    const button = await mount();
    document.body.style.fontFamily = "'Times New Roman', serif";
    const font = getComputedStyle(innerButton(button)).fontFamily;

    expect(getComputedStyle(document.body).fontFamily).to.include('Times');
    expect(font).to.include('system-ui');
    expect(font).to.not.include('Times');
  });

  it('should take the label weight from the shared typography token', async () => {
    const button = await mount();
    document.documentElement.style.setProperty('--bk-font-weight-medium', '700');

    expect(getComputedStyle(innerButton(button)).fontWeight).to.equal('700');
  });

  it('should take the disabled opacity from its control token', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    document.documentElement.style.setProperty('--bk-button-disabled-opacity', '0.25');

    expect(getComputedStyle(innerButton(button)).opacity).to.equal('0.25');
  });

  it('should default its disabled opacity to the base primitive', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;

    expect(
      getComputedStyle(innerButton(button)).opacity,
      'the hook holds no value of its own',
    ).to.equal('0.5');
  });

  it('should follow the base primitive when a host moves it', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    document.documentElement.style.setProperty('--bk-opacity-disabled', '0.3');

    expect(getComputedStyle(innerButton(button)).opacity).to.equal('0.3');
  });

  it('should change nothing under the pointer while the button is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <bk-button disabled>Save</bk-button>
        <bk-button>Cancel</bk-button>
      </div>
    `);
    const [button, enabled] = host.querySelectorAll<BkButton>('bk-button');
    const inner = innerButton(button);
    const enabledInner = innerButton(enabled);
    const backgroundBefore = getComputedStyle(inner).backgroundColor;
    const borderBefore = getComputedStyle(inner).borderTopColor;
    const enabledBefore = getComputedStyle(enabledInner).backgroundColor;

    await hover(enabledInner);

    expect(
      enabledInner.matches(':hover'),
      'the pointer reaches an enabled button, so its hover rule runs in this browser',
    ).to.equal(true);
    expect(
      getComputedStyle(enabledInner).backgroundColor,
      'and it paints that button',
    ).to.not.equal(enabledBefore);
    expect(inner.matches(':hover'), 'and leaves the disabled button alone').to.equal(false);

    await hover(inner);

    expect(inner.matches(':hover'), 'the pointer is on the disabled button').to.equal(true);
    expect(
      getComputedStyle(inner).backgroundColor,
      'a disabled button has no hover background',
    ).to.equal(backgroundBefore);
    expect(getComputedStyle(inner).borderTopColor, 'nor a hover border').to.equal(borderBefore);
  });

  it('should take the label colour from the on-accent role', async () => {
    const button = await mount();
    document.documentElement.style.setProperty('--bk-text-on-accent', 'rgb(1, 1, 1)');

    expect(getComputedStyle(innerButton(button)).color).to.equal('rgb(1, 1, 1)');
  });

  it('should take the secondary border from the border role', async () => {
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-border-default', 'rgb(2, 2, 2)');

    expect(getComputedStyle(innerButton(secondary)).borderTopColor).to.equal('rgb(2, 2, 2)');
  });

  it('should take the secondary label from the text role, not the on-accent role', async () => {
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-text-default', 'rgb(9, 9, 9)');
    document.documentElement.style.setProperty('--bk-text-on-accent', 'rgb(8, 8, 8)');

    expect(getComputedStyle(innerButton(secondary)).color).to.equal('rgb(9, 9, 9)');
  });
});

describe('bk-button in a form', () => {
  const inForm = (button: unknown) =>
    fixture<HTMLFormElement>(html`<form>${button}<input name="field" value="initial" /></form>`);

  it('should default to type button, so it never submits a form by accident', async () => {
    const button = await mount();

    expect(button.type).to.equal('button');
    expect(innerButton(button).type).to.equal('button');
  });

  it('should not submit the form it sits in unless asked to', async () => {
    const form = await inForm(html`<bk-button>Save</bk-button>`);
    let submits = 0;
    form.addEventListener('submit', (event) => {
      submits += 1;
      event.preventDefault();
    });

    innerButton(form.querySelector('bk-button')!).click();

    expect(submits).to.equal(0);
  });

  it('should submit the form when type is submit', async () => {
    const form = await inForm(html`<bk-button type="submit">Save</bk-button>`);
    let submits = 0;
    form.addEventListener('submit', (event) => {
      submits += 1;
      event.preventDefault();
    });

    innerButton(form.querySelector('bk-button')!).click();

    expect(submits).to.equal(1);
  });

  it('should reset the form when type is reset', async () => {
    const form = await inForm(html`<bk-button type="reset">Reset</bk-button>`);
    const field = form.querySelector('input')!;
    field.value = 'changed';

    innerButton(form.querySelector('bk-button')!).click();

    expect(field.value).to.equal('initial');
  });
});

describe('bk-button activation', () => {
  it('should ignore a programmatic click while disabled', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));

    button.click();

    expect(clicks).to.equal(0);
  });

  it('should still deliver a programmatic click when enabled', async () => {
    const button = await mount();
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));

    button.click();

    expect(clicks).to.equal(1);
  });

  it('should carry its label to the button that takes focus', async () => {
    const button = await fixture<BkButton>(html`<bk-button label="Close">x</bk-button>`);

    expect(innerButton(button).getAttribute('aria-label')).to.equal('Close');
  });

  it('should activate from Enter and Space', async () => {
    const button = await mount();
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));
    button.focus();

    await sendKeys({ press: 'Enter' });
    await sendKeys({ press: 'Space' });

    expect(clicks).to.equal(2);
  });

  it('should not activate from the keyboard while disabled', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));
    button.focus();

    await sendKeys({ press: 'Enter' });

    expect(clicks).to.equal(0);
  });
});

describe('bk-button as a form control', () => {
  it('should run the activation a real click runs', async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><bk-button type="submit">Save</bk-button></form>`,
    );
    const button = form.querySelector('bk-button') as BkButton;
    let submits = 0;
    form.addEventListener('submit', (event) => {
      submits += 1;
      event.preventDefault();
    });

    button.click();

    expect(submits).to.equal(1);
  });

  it('should be disabled by the fieldset that contains it', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled><bk-button type="submit">Save</bk-button></fieldset>
      </form>
    `);
    const button = form.querySelector('bk-button') as BkButton;
    let submits = 0;
    form.addEventListener('submit', (event) => {
      submits += 1;
      event.preventDefault();
    });
    await button.updateComplete;

    expect(innerButton(button).getAttribute('aria-disabled')).to.equal('true');
    innerButton(button).click();
    expect(submits).to.equal(0);
  });

  it('should act on the form named by the form attribute', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="target"></form>
        <bk-button type="submit" form="target">Save</bk-button>
      </div>
    `);
    const form = wrapper.querySelector('form') as HTMLFormElement;
    const button = wrapper.querySelector('bk-button') as BkButton;
    let submits = 0;
    form.addEventListener('submit', (event) => {
      submits += 1;
      event.preventDefault();
    });

    innerButton(button).click();

    expect(submits).to.equal(1);
  });
});
