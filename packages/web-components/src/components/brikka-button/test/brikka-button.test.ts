import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '.././define.js';
import type { BrikkaButton } from '.././brikka-button.js';
import { contrastRatio } from '@brikka-ui/test-utils/contrast.js';
import { expectNoViolations, expectRendered } from '@brikka-ui/test-utils/a11y.js';
import { colorOf } from '@brikka-ui/test-utils/style.js';
import { watchSubmit } from '@brikka-ui/test-utils/form.js';
import { clickAt, hover, hoverCapable } from '@brikka-ui/test-utils/pointer.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';
import { sendKeys, resetMouse } from '@web/test-runner-commands';

const innerButton = (el: BrikkaButton) => el.shadowRoot!.querySelector('button')!;

const mount = (variant?: string) =>
  fixture<BrikkaButton>(
    variant
      ? html`<brikka-button variant=${variant}>Save</brikka-button>`
      : html`<brikka-button>Save</brikka-button>`,
  );

describe('brikka-button', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const primary = await mount();

        await expectRendered(primary, 'button');
        await expectNoViolations(primary);
      });
    }
  });
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    for (const prop of [
      '--brikka-button-bg',
      '--brikka-bg-accent',
      '--brikka-bg-surface',
      '--brikka-border-default',
      '--brikka-text-default',
      '--brikka-text-on-accent',
      '--brikka-button-disabled-opacity',
      '--brikka-opacity-disabled',
      '--brikka-font-weight-medium',
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
    expect(
      getComputedStyle(innerButton(button)).backgroundColor,
      'the default variant is what the button paints, not only the attribute naming it',
    ).to.equal(await colorOf('var(--brikka-bg-accent)'));
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

  it('should draw no focus ring when the pointer focuses it', async () => {
    const button = await mount();
    const inner = innerButton(button);

    await clickAt(inner);
    await nextFrame();

    expect(inner.matches(':focus'), 'the pointer put focus on the inner button').to.equal(true);
    expect(inner.matches(':focus-visible'), 'a pointer click is not keyboard focus').to.equal(
      false,
    );
    expect(getComputedStyle(inner).outlineStyle, 'no ring is drawn').to.equal('none');
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
          <brikka-button>Save</brikka-button>
        </div>
      `);
      const el = host.querySelector<BrikkaButton>('brikka-button')!;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const style = getComputedStyle(innerButton(el));

      expect(style.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(style.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(
        contrastRatio(style.outlineColor, await colorOf('var(--brikka-bg-surface)')),
      ).to.be.at.least(3);
    });
  }

  it('should let a public custom property win over the variant default', async () => {
    const ghost = await mount('ghost');
    ghost.style.setProperty('--brikka-button-bg', 'rgb(1, 2, 3)');

    expect(getComputedStyle(innerButton(ghost)).backgroundColor).to.equal('rgb(1, 2, 3)');
  });

  it('should let an inherited public property win over the variant default', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--brikka-button-bg', 'rgb(9, 9, 9)');

    expect(getComputedStyle(innerButton(primary)).backgroundColor).to.equal('rgb(9, 9, 9)');
    expect(getComputedStyle(innerButton(secondary)).backgroundColor).to.equal('rgb(9, 9, 9)');
  });

  it('should map the default variant and a named variant to their roles', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--brikka-bg-accent', 'rgb(4, 5, 6)');
    document.documentElement.style.setProperty('--brikka-bg-surface', 'rgb(7, 8, 9)');

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
    document.documentElement.style.setProperty('--brikka-font-weight-medium', '700');

    expect(getComputedStyle(innerButton(button)).fontWeight).to.equal('700');
  });

  it('should take the disabled opacity from its control token', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    document.documentElement.style.setProperty('--brikka-button-disabled-opacity', '0.25');

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
    document.documentElement.style.setProperty('--brikka-opacity-disabled', '0.3');

    expect(getComputedStyle(innerButton(button)).opacity).to.equal('0.3');
  });

  it('should change nothing under the pointer while the button is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-button disabled>Save</brikka-button>
        <brikka-button>Cancel</brikka-button>
      </div>
    `);
    const [button, enabled] = host.querySelectorAll<BrikkaButton>('brikka-button');
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
    document.documentElement.style.setProperty('--brikka-text-on-accent', 'rgb(1, 1, 1)');

    expect(getComputedStyle(innerButton(button)).color).to.equal('rgb(1, 1, 1)');
  });

  it('should take the secondary border from the border role', async () => {
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--brikka-border-default', 'rgb(2, 2, 2)');

    expect(getComputedStyle(innerButton(secondary)).borderTopColor).to.equal('rgb(2, 2, 2)');
  });

  it('should take the secondary label from the text role, not the on-accent role', async () => {
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--brikka-text-default', 'rgb(9, 9, 9)');
    document.documentElement.style.setProperty('--brikka-text-on-accent', 'rgb(8, 8, 8)');

    expect(getComputedStyle(innerButton(secondary)).color).to.equal('rgb(9, 9, 9)');
  });

  describe('in a form', () => {
    const inForm = (button: unknown) =>
      fixture<HTMLFormElement>(html`<form>${button}<input name="field" value="initial" /></form>`);

    it('should default to type button, so it never submits a form by accident', async () => {
      const button = await mount();

      expect(button.type).to.equal('button');
      expect(innerButton(button).type).to.equal('button');
    });

    it('should not submit the form it sits in unless asked to', async () => {
      const form = await inForm(html`<brikka-button>Save</brikka-button>`);
      const watch = watchSubmit(form);

      innerButton(form.querySelector('brikka-button')!).click();

      expect(watch.count).to.equal(0);
    });

    it('should not submit from Enter pressed in another field', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <input name="first" value="one" />
          <input name="second" value="two" />
          <brikka-button type="submit">Save</brikka-button>
        </form>
      `);
      const button = form.querySelector('brikka-button') as BrikkaButton;
      const watch = watchSubmit(form);

      expect(Boolean(innerButton(button)), 'the button rendered').to.equal(true);

      form.querySelector('input')!.focus();
      await sendKeys({ press: 'Enter' });
      await button.updateComplete;
      await nextFrame();

      expect(watch.count, 'the shadow button is not the form’s default submit').to.equal(0);
    });

    it('should submit the form when type is submit', async () => {
      const form = await inForm(html`<brikka-button type="submit">Save</brikka-button>`);
      const watch = watchSubmit(form);

      innerButton(form.querySelector('brikka-button')!).click();

      expect(watch.count).to.equal(1);
    });

    it('should reset the form when type is reset', async () => {
      const form = await inForm(html`<brikka-button type="reset">Reset</brikka-button>`);
      const field = form.querySelector('input')!;
      field.value = 'changed';

      innerButton(form.querySelector('brikka-button')!).click();

      expect(field.value).to.equal('initial');
    });
  });

  describe('activation', () => {
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
      const button = await fixture<BrikkaButton>(
        html`<brikka-button label="Close">x</brikka-button>`,
      );

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

  describe('as a form control', () => {
    it('should run the activation a real click runs', async () => {
      const form = await fixture<HTMLFormElement>(
        html`<form><brikka-button type="submit">Save</brikka-button></form>`,
      );
      const button = form.querySelector('brikka-button') as BrikkaButton;
      const watch = watchSubmit(form);

      button.click();

      expect(watch.count).to.equal(1);
    });

    it('should submit with no submitter, so its name and value do not travel', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <input name="field" value="initial" />
          <brikka-button type="submit" name="action" value="save">Save</brikka-button>
        </form>
      `);
      const button = form.querySelector('brikka-button') as BrikkaButton;
      const watch = watchSubmit(form);
      let submitter: HTMLElement | null | undefined;
      let data: FormData | undefined;
      form.addEventListener('submit', (event) => {
        submitter = (event as SubmitEvent).submitter;
        data = new FormData(form);
      });

      innerButton(button).click();
      await button.updateComplete;

      expect(watch.count, 'the submit arrived').to.equal(1);
      expect(submitter === null, 'requestSubmit() ran without a submitter').to.equal(true);
      expect(data!.has('action'), 'the button name does not travel with it').to.equal(false);
    });

    it('should be disabled by the fieldset that contains it', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <fieldset disabled><brikka-button type="submit">Save</brikka-button></fieldset>
        </form>
      `);
      const button = form.querySelector('brikka-button') as BrikkaButton;
      const watch = watchSubmit(form);
      await button.updateComplete;

      expect(innerButton(button).getAttribute('aria-disabled')).to.equal('true');
      innerButton(button).click();
      expect(watch.count).to.equal(0);
    });

    it('should act on the form named by the form attribute', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <form id="target"></form>
          <brikka-button type="submit" form="target">Save</brikka-button>
        </div>
      `);
      const form = wrapper.querySelector('form') as HTMLFormElement;
      const button = wrapper.querySelector('brikka-button') as BrikkaButton;
      const watch = watchSubmit(form);

      innerButton(button).click();

      expect(watch.count).to.equal(1);
    });
  });
});
