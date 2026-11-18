import { settle } from '../../../test/helpers/settle.js';
import { colorOf } from '../../../test/helpers/style.js';
import { projectedText, slotIn } from '../../../test/helpers/dom.js';
import { labelAtom } from '../../../test/helpers/atoms.js';
import { watchSubmit } from '../../../test/helpers/form.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import '.././define.js';
import '../../bk-field/define.js';
import type { BkSwitch } from '.././bk-switch.js';
import { contrastRatio } from '../../../test/helpers/contrast.js';
import { expectNoViolations, expectRendered } from '../../../test/helpers/a11y.js';
import { clickAt, hover, hoverCapable } from '../../../test/helpers/pointer.js';
import { setTheme } from '../../../test/helpers/theme.js';

const innerInput = (el: BkSwitch) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkSwitch) => el.shadowRoot!.querySelector('label')!;
const innerTrack = (el: BkSwitch) => el.shadowRoot!.querySelector<HTMLElement>('[part="track"]')!;
const innerThumb = (el: BkSwitch) => el.shadowRoot!.querySelector<HTMLElement>('[part="thumb"]')!;
const innerRequired = (el: BkSwitch) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');
const innerDescription = (el: BkSwitch) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
const innerError = (el: BkSwitch) => el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const formData = (form: HTMLFormElement) => new FormData(form);

/* The thumb travels the distance the two geometry hooks leave between the track
 * ends: track width minus track height, with the thumb centred at each end. */
const travelOf = (el: BkSwitch): number => {
  const { width, height } = innerTrack(el).getBoundingClientRect();

  return width - height;
};

const translateOf = (el: BkSwitch): number => {
  const { transform } = getComputedStyle(innerThumb(el));

  return transform === 'none' ? 0 : Math.round(new DOMMatrix(transform).m41);
};

describe('bk-switch', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSwitch>(html`<bk-switch>${labelAtom('Wi-Fi')}</bk-switch>`);

        await expectRendered(el, 'input');
        await expectNoViolations(el);
      });
    }
  });

  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    for (const property of [
      '--bk-switch-track-width',
      '--bk-switch-thumb-size',
      '--bk-switch-radius',
    ]) {
      document.documentElement.style.removeProperty(property);
    }
    setTheme('light');
  });

  it('should render a label that points at a native checkbox announced as a switch', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch>${labelAtom('Wi-Fi')}</bk-switch>`);
    const input = innerInput(el);

    expect(innerLabel(el).htmlFor).to.equal(input.id);
    expect(input.id).to.not.equal('');
    expect(input.type, 'the platform keeps the state and the Space key').to.equal('checkbox');
    expect(input.getAttribute('role'), 'the state is announced as on or off').to.equal('switch');
    expect(
      input.closest('label') === innerLabel(el),
      'the input sits inside the label that names it',
    ).to.equal(true);
  });

  it('should take the label only from the label slot, never from a label attribute', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch name="wifi" label="Wi-Fi"></bk-switch>`);
    await el.updateComplete;

    expect(innerLabel(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
  });

  it('should take a description only from the description slot, never from a helper attribute', async () => {
    const el = await fixture<BkSwitch>(
      html`<bk-switch name="wifi" helper="The radio stays on."></bk-switch>`,
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

  it('should describe itself with the description slot while it has content', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
    const description = document.createElement('bk-field-description');
    description.slot = 'description';
    description.textContent = 'The radio stays on.';
    el.append(description);
    await settle(el);

    expect(innerInput(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);
    expect(projectedText(innerDescription(el))).to.equal('The radio stays on.');
  });

  it('should delegate focus to the inner switch', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);

    el.focus();

    expect(
      el.shadowRoot!.activeElement === innerInput(el),
      'focus lands on the native control',
    ).to.equal(true);
  });

  it('should paint the track muted while off and accent while on', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
    const track = innerTrack(el);

    expect(getComputedStyle(track).backgroundColor).to.equal(
      await colorOf('var(--bk-bg-surface-muted)'),
    );

    el.checked = true;
    await el.updateComplete;

    expect(getComputedStyle(track).backgroundColor).to.equal(await colorOf('var(--bk-bg-accent)'));
  });

  it('should move the thumb to the far end while on and back while off', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);

    expect(translateOf(el), 'the thumb starts at the leading end').to.equal(0);

    el.checked = true;
    await el.updateComplete;

    expect(translateOf(el), 'the thumb travels the width the hooks leave').to.equal(
      Math.round(travelOf(el)),
    );

    el.checked = false;
    await el.updateComplete;

    expect(translateOf(el), 'and comes back').to.equal(0);
  });

  it('should keep the thumb inside the track when the geometry hooks are overridden', async () => {
    document.documentElement.style.setProperty('--bk-switch-track-width', '60px');
    document.documentElement.style.setProperty('--bk-switch-thumb-size', '20px');
    const el = await fixture<BkSwitch>(html`<bk-switch checked></bk-switch>`);
    const thumb = innerThumb(el);

    expect(
      innerTrack(el).getBoundingClientRect().width,
      'the width hook paints the track',
    ).to.equal(60);
    expect(thumb.getBoundingClientRect().width, 'the thumb hook paints the thumb').to.equal(20);
    expect(
      translateOf(el),
      'one width decides the travel, so the thumb stays inside the track',
    ).to.equal(Math.round(travelOf(el)));
  });

  it('should toggle on activation and report the new state', async () => {
    const host = await fixture<HTMLElement>(html`<div><bk-switch></bk-switch></div>`);
    const el = host.querySelector<BkSwitch>('bk-switch')!;
    const details: unknown[] = [];
    host.addEventListener('bk-change', (event) => {
      details.push((event as CustomEvent).detail);
    });

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked, 'the property follows the browser').to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
    expect(
      el.hasAttribute('checked'),
      'the attribute stays what the author wrote: it is the reset default',
    ).to.equal(false);

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(false);
    expect(details, 'every change is announced, in order').to.deep.equal([
      { checked: true },
      { checked: false },
    ]);
  });

  it('should toggle from the keyboard, because the platform owns the key', async () => {
    const host = await fixture<HTMLElement>(html`
      <div><button type="button">before</button><bk-switch></bk-switch></div>
    `);
    const el = host.querySelector<BkSwitch>('bk-switch')!;

    (host.querySelector('button') as HTMLElement).focus();
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Space' });
    await el.updateComplete;

    expect(el.checked).to.equal(true);
  });

  it('should clear the error when the switch is toggled', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);

    el.error = 'Turn this on to continue.';
    await el.updateComplete;

    innerInput(el).click();
    await el.updateComplete;

    expect(el.error).to.equal('');
  });

  it('should paint the track hover while the field is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);

    await hover(innerLabel(el));

    expect(
      getComputedStyle(innerTrack(el)).backgroundColor,
      'an off track answers the pointer',
    ).to.equal(await colorOf('var(--bk-bg-surface-hover)'));

    el.checked = true;
    await el.updateComplete;

    expect(
      getComputedStyle(innerTrack(el)).backgroundColor,
      'an on track answers it with the accent hover role',
    ).to.equal(await colorOf('var(--bk-bg-accent-hover)'));
  });

  it('should draw the focus ring on the track when the switch is reached by keyboard', async () => {
    const host = await fixture<HTMLElement>(html`
      <div><button type="button">before</button><bk-switch></bk-switch></div>
    `);
    const el = host.querySelector<BkSwitch>('bk-switch')!;
    const track = innerTrack(el);

    expect(getComputedStyle(track).outlineStyle).to.equal('none');

    (host.querySelector('button') as HTMLElement).focus();
    await sendKeys({ press: 'Tab' });
    await nextFrame();

    expect(getComputedStyle(track).outlineStyle).to.equal('solid');
    expect(getComputedStyle(track).outlineColor).to.equal(await colorOf('var(--bk-focus-ring)'));
  });

  it('should draw no focus ring when the pointer reaches the switch', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch>${labelAtom('Wi-Fi')}</bk-switch>`);

    await clickAt(innerTrack(el));
    await el.updateComplete;

    expect(innerInput(el).matches(':focus')).to.equal(true);
    expect(
      getComputedStyle(innerTrack(el)).outlineStyle,
      'a pointer click is not keyboard focus',
    ).to.equal('none');
  });

  it('should refuse to toggle while disabled and stay focusable', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch disabled></bk-switch>`);
    const input = innerInput(el);
    let changes = 0;
    el.addEventListener('bk-change', () => {
      changes += 1;
    });

    input.click();
    await el.updateComplete;

    expect(input.getAttribute('aria-disabled')).to.equal('true');
    expect(
      input.hasAttribute('disabled'),
      'the native attribute would leave the tab order',
    ).to.equal(false);
    expect(el.checked).to.equal(false);
    expect(changes).to.equal(0);

    el.focus();
    expect(el.shadowRoot!.activeElement === input, 'focus stays on the input').to.equal(true);
  });

  it('should show the error, mark the field invalid and colour the message', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
    const error = 'Turn this on to continue.';

    el.error = error;
    await el.updateComplete;

    expect(innerError(el).textContent!.trim()).to.equal(error);
    expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    expect(getComputedStyle(innerError(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
    expect(getComputedStyle(innerTrack(el)).borderTopColor).to.equal(
      await colorOf('var(--bk-border-danger)'),
    );
  });

  it('should mark a required switch with the label glyph', async () => {
    const el = await fixture<BkSwitch>(html`<bk-switch required>${labelAtom('Wi-Fi')}</bk-switch>`);

    expect(innerRequired(el), 'a labelled required switch carries the mark').to.not.equal(null);
    expect(innerRequired(el)!.getAttribute('aria-hidden')).to.equal('true');
    expect(innerInput(el).required, 'the constraint is the native one').to.equal(true);
  });

  it('should start the message block where the label text starts', async () => {
    const el = await fixture<BkSwitch>(html`
      <bk-switch>
        <bk-field-label slot="label">Wi-Fi</bk-field-label>
        <bk-field-description slot="description">The radio stays on.</bk-field-description>
      </bk-switch>
    `);
    const label = el.querySelector('bk-field-label')!.getBoundingClientRect();
    const track = innerTrack(el).getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(track.left, 'the track starts the row').to.be.lessThan(label.left);
    expect(
      Math.round(description.left),
      'the block is indented by the track and the row gap',
    ).to.equal(Math.round(label.left));
    expect(slotIn(el, 'description')!.assignedElements({ flatten: true }).length).to.equal(1);
  });

  describe('contrast', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should keep the track boundary at 3:1 against the surface (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
        const style = getComputedStyle(innerTrack(el));

        expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
      });

      it(`should keep the thumb at 3:1 against the on track (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSwitch>(html`<bk-switch checked></bk-switch>`);
        const track = getComputedStyle(innerTrack(el));
        const thumb = getComputedStyle(innerThumb(el));

        expect(contrastRatio(thumb.backgroundColor, track.backgroundColor)).to.be.at.least(3);
      });

      it(`should keep the thumb edge at 3:1 against the off track (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
        const track = getComputedStyle(innerTrack(el));
        const thumb = getComputedStyle(innerThumb(el));

        expect(contrastRatio(thumb.borderTopColor, track.backgroundColor)).to.be.at.least(3);
      });

      it(`should keep the focus ring at 3:1 against the surface (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSwitch>(html`<bk-switch></bk-switch>`);
        const style = getComputedStyle(innerTrack(el));

        expect(
          contrastRatio(style.outlineColor, await colorOf('var(--bk-bg-surface)')),
        ).to.be.at.least(3);
      });
    }
  });

  describe('form participation', () => {
    it('should submit the platform default while on and nothing while off', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <bk-switch name="wifi" checked></bk-switch>
          <bk-switch name="bluetooth"></bk-switch>
        </form>
      `);
      const [wifi, bluetooth] = form.querySelectorAll<BkSwitch>('bk-switch');

      expect(formData(form).get('wifi')).to.equal('on');
      expect(formData(form).get('bluetooth')).to.equal(null);

      wifi.checked = false;
      bluetooth.checked = true;
      await wifi.updateComplete;
      await bluetooth.updateComplete;

      expect(formData(form).get('wifi')).to.equal(null);
      expect(formData(form).get('bluetooth')).to.equal('on');
    });

    it('should submit its value instead of the platform default', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-switch name="wifi" value="enabled" checked></bk-switch></form>
      `);

      expect(formData(form).get('wifi')).to.equal('enabled');
    });

    it('should report valueMissing and block the submit while required and off', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-switch name="wifi" required></bk-switch></form>
      `);
      const el = form.querySelector<BkSwitch>('bk-switch')!;
      await el.updateComplete;
      const watch = watchSubmit(form);

      form.requestSubmit();
      await el.updateComplete;

      expect(el.validity.valueMissing).to.equal(true);
      expect(watch.invalidOrder[0] === el, 'the invalid event fires on the switch').to.equal(true);
      expect(watch.count).to.equal(0);
      expect(innerError(el).textContent!.trim()).to.equal(innerInput(el).validationMessage);
      expect(innerInput(el).getAttribute('aria-invalid')).to.equal('true');
    });

    it('should restore the authored state on reset and drop the error', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-switch name="wifi" checked></bk-switch></form>
      `);
      const el = form.querySelector<BkSwitch>('bk-switch')!;

      el.checked = false;
      el.error = 'Turn this on to continue.';
      await el.updateComplete;

      form.reset();
      await el.updateComplete;

      expect(el.checked, 'the attribute is the state the form returns to').to.equal(true);
      expect(innerInput(el).checked).to.equal(true);
      expect(el.error, 'a reset clears the error').to.equal('');
    });

    it('should submit nothing and report no error while disabled', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-switch name="wifi" required disabled></bk-switch></form>
      `);
      const el = form.querySelector<BkSwitch>('bk-switch')!;
      await el.updateComplete;

      expect(formData(form).get('wifi')).to.equal(null);
      expect(el.validity.valid, 'a disabled control asks nothing of the form').to.equal(true);
    });
  });
});
