import { settle } from '../../../../../../test/helpers/settle.js';
import { clearStyleCache, colorOf, opacityOf } from '../../../../../../test/helpers/style.js';
import { projectedText, slotIn } from '../../../../../../test/helpers/dom.js';
import { labelAtom } from '../../../../../../test/helpers/atoms.js';
import { watchSubmit } from '../../../../../../test/helpers/form.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { resetMouse, sendKeys, sendMouse } from '@web/test-runner-commands';
import '../define.js';
import '../../bk-field/define.js';
import type { BkSlider } from '../bk-slider.js';
import { contrastRatio } from '../../../../../../test/helpers/contrast.js';
import { expectNoViolations, expectRendered } from '../../../../../../test/helpers/a11y.js';
import { clickAt, hover, hoverCapable } from '../../../../../../test/helpers/pointer.js';
import { setTheme } from '../../../../../../test/helpers/theme.js';

const inputsOf = (el: BkSlider) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLInputElement>('input'));

const inputOf = (el: BkSlider): HTMLInputElement => inputsOf(el)[0]!;

const endInputOf = (el: BkSlider): HTMLInputElement | null => inputsOf(el)[1] ?? null;

const labelOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLLabelElement>('label')!;

const railOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLElement>('[part="track"]')!;

const fillOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLElement>('[part="fill"]')!;

const ticksLayerOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLElement>('[part="ticks"]');

const ticksOf = (el: BkSlider) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="tick"]'));

const readoutOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLElement>('[part="tooltip"]');

const middleOf = (element: Element): [number, number] => {
  const { left, top, width, height } = element.getBoundingClientRect();

  return [left + width / 2, top + height / 2];
};

const descriptionOf = (el: BkSlider) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;

const errorOf = (el: BkSlider) => el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const formData = (form: HTMLFormElement) => new FormData(form);

/* The thumb is a `::-webkit-slider-thumb` pseudo-element: it has no node to query and no
 * computed style of its own, so a case that talks about its paint reads the rule the shadow
 * root adopted and the role that rule declares. Everything else is measured. */
const ruleOf = (el: BkSlider, selector: string): CSSStyleRule => {
  const rules = el.shadowRoot!.adoptedStyleSheets.flatMap((sheet) =>
    Array.from(sheet.cssRules),
  ) as CSSStyleRule[];
  const found = rules.find((rule) => rule.selectorText?.includes(selector));

  if (!found) throw new Error(`the shadow root declares no rule for ${selector}`);

  return found;
};

/* The input is sized to the thumb and centred on the track, so its block box is the thumb's
 * size for the horizontal layout the geometry cases measure. */
const thumbOf = (el: BkSlider): number => inputOf(el).getBoundingClientRect().height;

/* The travel of a thumb: the lane the two hooks leave between the ends of the track. */
const laneOf = (el: BkSlider): number => railOf(el).getBoundingClientRect().width - thumbOf(el);

const paintOf = (rule: CSSStyleRule, property: string): string =>
  rule.style.getPropertyValue(property).trim();

describe('bk-slider', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`<bk-slider>${labelAtom('Volume')}</bk-slider>`);

        await expectRendered(el, 'input');
        await expectNoViolations(el);
      });
    }

    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations with ticks and a readout (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`
          <bk-slider ticks min="0" max="10" step="1" tooltip="always" value-text="5 of 10">
            ${labelAtom('Volume')}
          </bk-slider>
        `);

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
      '--bk-slider-thumb-size',
      '--bk-slider-track-height',
      '--bk-slider-radius',
      '--bk-slider-tick-size',
    ]) {
      document.documentElement.style.removeProperty(property);
    }
    setTheme('light');
    clearStyleCache();
  });

  describe('anatomy', () => {
    it('should point a label at one real range input for one thumb', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider>${labelAtom('Volume')}</bk-slider>`);
      const input = inputOf(el);

      expect(inputsOf(el).length, 'one thumb, one input').to.equal(1);
      expect(labelOf(el).htmlFor).to.equal(input.id);
      expect(input.id).to.not.equal('');
      expect(input.type, 'the platform keeps the drag, the keys and the value').to.equal('range');
      expect(railOf(el).contains(input), 'the input sits on the track it drags along').to.equal(
        true,
      );
    });

    it('should never hide the range input behind the paint', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
      const input = inputOf(el);
      const box = input.getBoundingClientRect();
      const rail = railOf(el).getBoundingClientRect();
      const thumb =
        rail.width - el.shadowRoot!.querySelector('.lane')!.getBoundingClientRect().width;

      expect(
        getComputedStyle(input).appearance,
        'appearance: none is the paint; it is not a hidden control',
      ).to.equal('none');
      expect(getComputedStyle(input).opacity, 'a hidden input would be transparent').to.equal('1');
      expect(box.width, 'the input spans the track it hit-tests').to.equal(rail.width);
      expect(box.height, 'the height is the thumb hook the lane is inset by').to.equal(thumb);
    });

    it('should render a second input only while value-end is set', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="20"></bk-slider>`);

      expect(inputsOf(el).length, 'one thumb while value-end is null').to.equal(1);
      expect(el.shadowRoot!.querySelector('[part="input-end"]')).to.equal(null);

      el.valueEnd = 80;
      await el.updateComplete;

      expect(inputsOf(el).length, 'setting value-end adds the upper thumb').to.equal(2);
      expect(endInputOf(el)!.getAttribute('part')).to.equal('input-end');

      el.valueEnd = null;
      await el.updateComplete;

      expect(inputsOf(el).length, 'and clearing it takes the thumb away').to.equal(1);
    });

    it('should forward min, max and step to both inputs', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider min="10" max="90" step="5" value="20" value-end="80"></bk-slider>
      `);

      for (const input of inputsOf(el)) {
        expect(input.min).to.equal('10');
        expect(input.max).to.equal('90');
        expect(input.step).to.equal('5');
      }
    });

    it('should take the label only from the label slot, never from a label attribute', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider name="volume" label="Volume"></bk-slider>`,
      );
      await el.updateComplete;

      expect(labelOf(el).hidden, 'an unlabelled field hides its empty label row').to.equal(true);
      expect(labelOf(el).textContent!.trim(), 'the attribute names nothing').to.equal('');
      expect(
        inputOf(el).getAttribute('aria-label'),
        'and no attribute is turned into a name instead',
      ).to.equal(null);
    });

    it('should describe itself with the description slot while it has content', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
      const description = document.createElement('bk-field-description');
      description.slot = 'description';
      description.textContent = 'The room the speaker fills.';
      el.append(description);
      await settle(el);

      expect(inputOf(el).getAttribute('aria-describedby')).to.equal(descriptionOf(el).id);
      expect(projectedText(descriptionOf(el))).to.equal('The room the speaker fills.');
      expect(slotIn(el, 'description')!.assignedElements({ flatten: true }).length).to.equal(1);
    });

    it('should take a description only from the description slot, never from an attribute', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider name="volume" helper="The room the speaker fills."></bk-slider>
      `);
      await el.updateComplete;

      expect(descriptionOf(el).textContent!.trim()).to.equal('');
      expect(inputOf(el).getAttribute('aria-describedby')).to.equal(null);
    });

    it('should ship no required mark, because a range always has a value', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider required>${labelAtom('Volume')}</bk-slider>`,
      );
      await el.updateComplete;

      expect(el.shadowRoot!.querySelector('[part="required"]'), 'no glyph').to.equal(null);
      expect(
        inputOf(el).hasAttribute('required'),
        'and no constraint the platform refuses',
      ).to.equal(false);
    });

    it('should keep the thumb a pseudo-element, because a part cannot reach one', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);

      expect(el.shadowRoot!.querySelector('[part="thumb"]')).to.equal(null);
      expect(paintOf(ruleOf(el, '::-webkit-slider-thumb'), 'background')).to.equal(
        'var(--bk-bg-accent)',
      );
      expect(
        paintOf(ruleOf(el, '::-webkit-slider-thumb'), 'border'),
        'the knob is the run colour, so its edge is what separates the two',
      ).to.contain('var(--bk-border-on-accent)');
    });
  });

  describe('value', () => {
    it('should clamp value to value-end without swapping what the author set', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value-end="80"></bk-slider>`);

      el.value = 20;
      await el.updateComplete;

      el.value = 90;
      await el.updateComplete;

      expect(el.value, 'the lower thumb stops at the upper one').to.equal(80);
      expect(el.valueEnd, 'and the upper thumb keeps the value the author wrote').to.equal(80);

      el.valueEnd = 10;
      await el.updateComplete;

      expect(el.value, 'the lower thumb follows it down rather than swapping roles').to.equal(10);
      expect(el.valueEnd).to.equal(10);
      expect(inputOf(el).value).to.equal('10');
      expect(endInputOf(el)!.value).to.equal('10');
    });

    it('should let the platform clamp a value outside the range', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="volume" min="10" max="90" value="120"></bk-slider></form>
      `);
      const el = form.querySelector<BkSlider>('bk-slider')!;
      await el.updateComplete;

      expect(el.value, 'the property keeps what was written').to.equal(120);
      expect(inputOf(el).value, 'the browser clamps the value it holds, not the element').to.equal(
        '90',
      );
      expect(formData(form).get('volume'), 'and the form submits what the control shows').to.equal(
        '90',
      );
    });

    it('should paint the run from the start of the track to the thumb', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="0"></bk-slider>`);

      const atMin = fillOf(el).getBoundingClientRect();
      const railAtMin = el.shadowRoot!.querySelector('[part="track"]')!.getBoundingClientRect();
      const thumbSize = el.shadowRoot!.querySelector('input')!.getBoundingClientRect().height;

      expect(
        atMin.width,
        'the run reaches the thumb centre, which is half a thumb wide from the edge',
      ).to.be.closeTo(thumbSize / 2, 1);
      expect(atMin.left, 'and it starts at the rail edge, with no nub').to.equal(railAtMin.left);

      el.value = 50;
      await el.updateComplete;

      expect(
        fillOf(el).getBoundingClientRect().width,
        'half the lane plus the cap that reaches the rail edge',
      ).to.be.closeTo(laneOf(el) / 2 + thumbSize / 2, 1);

      el.value = 100;
      await el.updateComplete;

      expect(fillOf(el).getBoundingClientRect().width, 'the whole lane and its cap').to.be.closeTo(
        laneOf(el) + thumbSize / 2,
        1,
      );
    });

    it('should paint the run between the two thumbs', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="20" value-end="80"></bk-slider>`);
      const rail = railOf(el).getBoundingClientRect();
      const fill = fillOf(el).getBoundingClientRect();
      const lane = laneOf(el);

      expect(fill.left - rail.left, 'the run starts at the lower thumb').to.be.closeTo(
        thumbOf(el) / 2 + lane * 0.2,
        1,
      );
      expect(fill.width, 'and ends at the upper one').to.be.closeTo(lane * 0.6, 1);
    });
  });

  describe('ticks', () => {
    it('should draw one tick per step across the run', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider ticks min="0" max="10" step="1"></bk-slider>`,
      );
      const ticks = ticksOf(el);
      const rail = railOf(el).getBoundingClientRect();
      const start = rail.left + thumbOf(el) / 2;

      expect(Boolean(ticksLayerOf(el)), 'the layer has its own part').to.equal(true);
      expect(ticks.length, 'the count is (max - min) / step').to.equal(10);
      expect(middleOf(ticks[0]!)[0], 'the first mark is the minimum').to.be.closeTo(start, 1);
      expect(
        middleOf(ticks[1]!)[0],
        'and each step moves one mark by a tenth of the lane',
      ).to.be.closeTo(start + laneOf(el) * 0.1, 1);
      expect(middleOf(ticks[9]!)[0], 'the last one is a step short of the maximum').to.be.closeTo(
        start + laneOf(el) * 0.9,
        1,
      );
    });

    it('should draw nothing from step alone', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider step="5"></bk-slider>`);

      expect(Boolean(ticksLayerOf(el)), 'step without ticks draws no layer').to.equal(false);
      expect(ticksOf(el).length).to.equal(0);
    });

    it('should hide the tick layer from assistive technology', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider ticks min="0" max="4" step="1" value="2" value-text="2 of 4"></bk-slider>
      `);

      expect(
        ticksLayerOf(el)!.getAttribute('aria-hidden'),
        'the ticks are decoration, not a second value',
      ).to.equal('true');
      expect(
        inputOf(el).getAttribute('aria-valuetext'),
        'the value text stays the announcement',
      ).to.equal('2 of 4');
    });

    it('should place the ticks along the run in vertical', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider ticks min="0" max="4" step="1" orientation="vertical"></bk-slider>
      `);
      const ticks = ticksOf(el);
      const rail = railOf(el).getBoundingClientRect();
      const thumb = inputOf(el).getBoundingClientRect().width;
      const lane = rail.height - thumb;

      expect(ticks.length).to.equal(4);
      expect(middleOf(ticks[0]!)[1], 'the minimum is the bottom end').to.be.closeTo(
        rail.bottom - thumb / 2,
        1,
      );
      expect(middleOf(ticks[3]!)[1], 'and the run climbs with the value').to.be.closeTo(
        rail.bottom - thumb / 2 - lane * 0.75,
        1,
      );
      expect(middleOf(ticks[0]!)[0], 'on the rail').to.be.closeTo(rail.left + rail.width / 2, 1);
    });

    it('should size the ticks through the hook', async () => {
      document.documentElement.style.setProperty('--bk-slider-tick-size', '8px');
      const el = await fixture<BkSlider>(
        html`<bk-slider ticks min="0" max="3" step="1"></bk-slider>`,
      );
      const tick = ticksOf(el)[0]!.getBoundingClientRect();

      expect(tick.width, 'the tick hook sizes the mark across').to.equal(8);
      expect(
        tick.height,
        'and the mark spans the rail, so it reads as a division and not as a dot',
      ).to.be.closeTo(railOf(el).getBoundingClientRect().height, 1);
    });
  });

  describe('tooltip', () => {
    it('should render no readout while tooltip is none', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider value="40" value-text="40 %"></bk-slider>`,
      );
      await el.updateComplete;

      expect(el.tooltip, 'none is the default').to.equal('none');
      expect(Boolean(readoutOf(el)), 'and it draws nothing').to.equal(false);
    });

    it('should read the value text, or the value without one, while always', async () => {
      const labelled = await fixture<BkSlider>(
        html`<bk-slider tooltip="always" value="40" value-text="40 %"></bk-slider>`,
      );

      expect(readoutOf(labelled)!.textContent!.trim(), 'the value text when there is one').to.equal(
        '40 %',
      );
      expect(
        readoutOf(labelled)!.getAttribute('aria-hidden'),
        'the readout is the visual echo of the announcement',
      ).to.equal('true');
      expect(
        inputOf(labelled).getAttribute('aria-valuetext'),
        'which stays the value text on the knob',
      ).to.equal('40 %');

      const bare = await fixture<BkSlider>(
        html`<bk-slider tooltip="always" value="40"></bk-slider>`,
      );

      expect(readoutOf(bare)!.textContent!.trim(), 'the value without a value text').to.equal('40');
    });

    it('should read the lower thumb while a pair is set', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider
          tooltip="always"
          value="20"
          value-end="80"
          value-text="20"
          value-text-end="80"
        ></bk-slider>
      `);

      expect(readoutOf(el)!.textContent!.trim(), 'one readout, on the lower thumb').to.equal('20');
    });

    it('should keep the readout on screen while the drag is held off the knob', async function () {
      if (!hoverCapable()) this.skip();

      const host = await fixture<HTMLElement>(html`
        <div><bk-slider tooltip="hover" value="20"></bk-slider></div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;
      const rail = railOf(el).getBoundingClientRect();
      const start: [number, number] = [
        Math.round(rail.left + thumbOf(el) / 2 + laneOf(el) * 0.2),
        Math.round(rail.top + rail.height / 2),
      ];

      await sendMouse({ type: 'move', position: start });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'move', position: [start[0] + 60, start[1] - 40] });
      await el.updateComplete;

      expect(
        getComputedStyle(readoutOf(el)!).opacity,
        'the value being chosen stays readable while the knob is held',
      ).to.equal('1');

      await sendMouse({ type: 'up' });
      await nextFrame();

      expect(getComputedStyle(readoutOf(el)!).opacity, 'and leaves with the gesture').to.equal('0');
    });

    it('should keep the readout hidden until the knob is hovered in hover mode', async function () {
      if (!hoverCapable()) this.skip();

      const el = await fixture<BkSlider>(html`<bk-slider tooltip="hover" value="50"></bk-slider>`);

      expect(getComputedStyle(readoutOf(el)!).opacity, 'hidden at rest').to.equal('0');

      await hover(inputOf(el));

      expect(getComputedStyle(readoutOf(el)!).opacity, 'shown under the pointer').to.equal('1');

      await sendMouse({ type: 'move', position: [0, 0] });
      await nextFrame();

      expect(getComputedStyle(readoutOf(el)!).opacity, 'hidden when the pointer leaves').to.equal(
        '0',
      );
    });

    it('should show the readout while the knob has focus in hover mode', async () => {
      const host = await fixture<HTMLElement>(html`
        <div><button type="button">before</button><bk-slider tooltip="hover"></bk-slider></div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;

      expect(getComputedStyle(readoutOf(el)!).opacity, 'hidden before the key').to.equal('0');

      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();

      expect(inputOf(el).matches(':focus'), 'the key reached the knob').to.equal(true);
      expect(getComputedStyle(readoutOf(el)!).opacity, 'and the readout with it').to.equal('1');
    });

    it('should reflect the mode and never write an invalid one', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
      await el.updateComplete;

      expect(el.getAttribute('tooltip'), 'the default is reflected').to.equal('none');

      el.setAttribute('tooltip', 'whenever');
      await el.updateComplete;

      expect(el.tooltip, 'an unknown mode reads as none').to.equal('none');
      expect(el.getAttribute('tooltip'), 'and the attribute never carries it').to.equal('none');

      el.tooltip = 'hover';
      await el.updateComplete;

      expect(el.getAttribute('tooltip'), 'a real mode is reflected').to.equal('hover');
    });

    it('should sit above the knob and follow it along the run', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider tooltip="always" value="40" value-text="40 degrees"></bk-slider>`,
      );
      const rail = railOf(el).getBoundingClientRect();
      const readout = readoutOf(el)!.getBoundingClientRect();
      const knob = rail.left + thumbOf(el) / 2 + laneOf(el) * 0.4;

      expect(readout.bottom, 'the bubble clears the rail it points at').to.be.at.most(rail.top);
      expect(
        rail.top - readout.bottom,
        'by the gap the rail gives it, which is a hook now',
      ).to.be.at.least(8);
      expect(middleOf(readoutOf(el)!)[0], 'and is centred over the knob').to.be.closeTo(knob, 1);
    });

    it('should draw a tail under the bubble that points at the knob', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider tooltip="always" value="40"></bk-slider>`);
      const tail = getComputedStyle(readoutOf(el)!, '::after');

      expect(tail.content, 'a tail exists').to.not.equal('none');
      expect(tail.backgroundColor, 'and it is the same inverse surface').to.equal(
        await colorOf('var(--bk-bg-inverse)'),
      );
      expect(tail.transform, 'drawn as a square turned on its corner').to.contain('matrix');
      expect(tail.insetBlockEnd, 'hanging off the bubble towards the rail').to.equal('-2px');

      const vertical = await fixture<BkSlider>(
        html`<bk-slider tooltip="always" value="40" orientation="vertical"></bk-slider>`,
      );
      const side = getComputedStyle(readoutOf(vertical)!, '::after');

      expect(
        side.insetInlineEnd,
        'and on the vertical run it points sideways, at the rail beside it',
      ).to.equal('-2px');
    });

    it('should not reserve room for the readout, so the control never moves', async () => {
      const plain = await fixture<BkSlider>(html`<bk-slider value="40"></bk-slider>`);
      const shown = await fixture<BkSlider>(
        html`<bk-slider value="40" tooltip="always" value-text="40 %"></bk-slider>`,
      );
      const offsetOf = (el: BkSlider) =>
        Math.round(railOf(el).getBoundingClientRect().top - el.getBoundingClientRect().top);
      const on = railOf(shown).getBoundingClientRect();

      expect(offsetOf(shown), 'the track sits where it always sits').to.equal(offsetOf(plain));
      expect(railOf(shown).getBoundingClientRect().height).to.equal(
        railOf(plain).getBoundingClientRect().height,
      );
      expect(
        readoutOf(shown)!.getBoundingClientRect().top,
        'and the bubble floats over the row above instead of pushing the control down',
      ).to.be.below(on.top);
    });

    it('should sit beside the knob in vertical', async () => {
      const el = await fixture<BkSlider>(html`
        <bk-slider tooltip="always" value="40" orientation="vertical"></bk-slider>
      `);
      const rail = railOf(el).getBoundingClientRect();
      const thumb = inputOf(el).getBoundingClientRect().width;
      const lane = rail.height - thumb;
      const readout = readoutOf(el)!.getBoundingClientRect();

      expect(readout.right, 'the bubble clears the rail').to.be.at.most(rail.left);
      expect(rail.left - readout.right, 'by the gap it leaves').to.be.at.least(4);
      expect(middleOf(readoutOf(el)!)[1], 'and is centred on the knob').to.be.closeTo(
        rail.bottom - thumb / 2 - lane * 0.4,
        1,
      );
      expect(
        getComputedStyle(readoutOf(el)!).writingMode,
        'the rail writes vertically; the readout does not',
      ).to.equal('horizontal-tb');
    });
  });

  describe('events', () => {
    it('should report the value after a key, the input before the change', async () => {
      const host = await fixture<HTMLElement>(html`
        <div><bk-slider name="volume" value="40"></bk-slider></div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;
      const events: string[] = [];
      const details: unknown[] = [];
      el.addEventListener('bk-input', (event) => {
        events.push('input');
        details.push((event as CustomEvent).detail);
      });
      el.addEventListener('bk-change', (event) => {
        events.push('change');
        details.push((event as CustomEvent).detail);
      });

      inputOf(el).focus();
      await sendKeys({ press: 'ArrowRight' });
      await el.updateComplete;

      expect(el.value, 'the platform owns the key').to.equal(41);
      expect(events, 'a key is a drag and a release in one').to.deep.equal(['input', 'change']);
      expect(details).to.deep.equal([
        { value: 41, valueEnd: null },
        { value: 41, valueEnd: null },
      ]);
    });

    it('should announce input while dragging and change when it settles', async () => {
      const host = await fixture<HTMLElement>(html`
        <div><bk-slider name="volume" value="20"></bk-slider></div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;
      const events: string[] = [];
      el.addEventListener('bk-input', () => events.push('input'));
      el.addEventListener('bk-change', () => events.push('change'));

      const rail = railOf(el).getBoundingClientRect();
      const start: [number, number] = [
        Math.round(rail.left + thumbOf(el) / 2 + laneOf(el) * 0.2),
        Math.round(rail.top + rail.height / 2),
      ];

      await sendMouse({ type: 'move', position: start });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'move', position: [start[0] + 40, start[1]] });
      await el.updateComplete;

      expect(events, 'a drag in progress is an input, never a change').to.deep.equal(['input']);
      expect(el.value, 'the value followed the pointer').to.be.above(20);

      await sendMouse({ type: 'up' });
      await el.updateComplete;

      expect(events, 'the release is the one change').to.deep.equal(['input', 'change']);
    });

    it('should drag either thumb of a pair, never both and never none', async () => {
      const host = await fixture<HTMLElement>(html`
        <div><bk-slider value="20" value-end="80"></bk-slider></div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;
      const rail = railOf(el).getBoundingClientRect();
      const lane = laneOf(el);
      const thumb = thumbOf(el);
      const at = (percentage: number): [number, number] => [
        Math.round(rail.left + thumb / 2 + lane * percentage),
        Math.round(rail.top + rail.height / 2),
      ];

      await sendMouse({ type: 'move', position: at(0.8) });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'move', position: at(0.5) });
      await sendMouse({ type: 'up' });
      await el.updateComplete;

      expect(el.valueEnd, 'the upper thumb is the one that moved').to.be.closeTo(51, 2);
      expect(el.value, 'the lower one stayed where it was').to.equal(20);

      await sendMouse({ type: 'move', position: at(0.2) });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'move', position: at(0.4) });
      await sendMouse({ type: 'up' });
      await el.updateComplete;

      expect(el.value, 'and the lower thumb answers the pointer too').to.be.closeTo(41, 2);
      expect(el.valueEnd).to.be.closeTo(51, 2);
    });

    it('should open a collapsed pair whichever way the pointer drags', async () => {
      const point = (el: BkSlider, at: number): [number, number] => {
        const rail = railOf(el).getBoundingClientRect();
        return [
          Math.round(rail.left + thumbOf(el) / 2 + laneOf(el) * at),
          Math.round(rail.top + rail.height / 2),
        ];
      };

      const dragTo = async (from: string, to: number): Promise<BkSlider> => {
        const host = await fixture<HTMLElement>(html`
          <div><bk-slider value=${from} value-end=${from}></bk-slider></div>
        `);
        const el = host.querySelector<BkSlider>('bk-slider')!;

        await sendMouse({ type: 'move', position: point(el, Number(from) / 100) });
        await sendMouse({ type: 'down' });
        await sendMouse({ type: 'move', position: point(el, to) });
        await sendMouse({ type: 'up' });
        await el.updateComplete;
        return el;
      };

      const down = await dragTo('100', 0.6);
      expect(down.value, 'the lower thumb opens a max/max pair downward').to.be.closeTo(61, 2);
      expect(down.valueEnd, 'and the upper thumb keeps its value').to.equal(100);

      await sendMouse({ type: 'move', position: point(down, 1) });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'move', position: point(down, 0.8) });
      await sendMouse({ type: 'up' });
      await down.updateComplete;

      expect(down.valueEnd, 'the thumb it chose does not outlive the release').to.be.below(100);

      const up = await dragTo('0', 0.4);

      expect(up.value, 'the lower thumb keeps its value').to.equal(0);
      expect(up.valueEnd, 'and the upper thumb opens a 0/0 pair upward').to.be.closeTo(41, 2);
    });

    it('should move with the arrow keys, Home and End', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider step="10"></bk-slider>`);

      inputOf(el).focus();
      await sendKeys({ press: 'ArrowRight' });
      await el.updateComplete;

      expect(el.value).to.equal(10);

      await sendKeys({ press: 'ArrowLeft' });
      await sendKeys({ press: 'ArrowLeft' });
      await el.updateComplete;

      expect(el.value).to.equal(0);

      await sendKeys({ press: 'End' });
      await el.updateComplete;

      expect(el.value, 'End is the maximum').to.equal(100);

      await sendKeys({ press: 'Home' });
      await el.updateComplete;

      expect(el.value, 'Home is the minimum').to.equal(0);
    });

    it('should ask for a vertical orientation and answer the arrow keys', async () => {
      const el = await fixture<BkSlider>(
        html`<bk-slider orientation="vertical" value="50"></bk-slider>`,
      );
      const rail = railOf(el).getBoundingClientRect();

      expect(el.getAttribute('orientation'), 'the variant is reflected').to.equal('vertical');
      expect(
        inputOf(el).getAttribute('aria-orientation'),
        'the APG asks a vertical slider',
      ).to.equal('vertical');
      expect(rail.height, 'the layout is CSS only').to.be.above(rail.width);
      expect(getComputedStyle(railOf(el)).writingMode).to.contain('vertical');

      inputOf(el).focus();
      await sendKeys({ press: 'ArrowUp' });
      await el.updateComplete;

      expect(el.value, 'up is more, whichever axis the slider runs on').to.equal(51);

      await sendKeys({ press: 'ArrowDown' });
      await el.updateComplete;

      expect(el.value).to.equal(50);

      el.value = 25;
      await el.updateComplete;

      const fill = fillOf(el).getBoundingClientRect();
      const lane = rail.height - inputOf(el).getBoundingClientRect().width;

      const cap = inputOf(el).getBoundingClientRect().width / 2;

      expect(
        rail.bottom - fill.top,
        'the run ends a quarter of the lane above the bottom the keys call the minimum',
      ).to.be.closeTo(lane * 0.25 + cap, 1);
      expect(fill.height, 'and its length carries the cap back to the edge').to.be.closeTo(
        lane * 0.25 + cap,
        1,
      );
      expect(fill.bottom, 'so the run reaches the rail, with no nub below it').to.be.closeTo(
        rail.bottom,
        1,
      );

      const bottom: [number, number] = [
        Math.round(rail.left + rail.width / 2),
        Math.round(rail.bottom - 4),
      ];
      await sendMouse({ type: 'move', position: bottom });
      await sendMouse({ type: 'down' });
      await sendMouse({ type: 'up' });
      await el.updateComplete;

      expect(el.value, 'and the pointer agrees with the arrows').to.be.below(10);
    });

    it('should forward the value text and name both thumbs while there are two', async () => {
      const one = await fixture<BkSlider>(html`
        <bk-slider value="20" value-text="20 degrees"></bk-slider>
      `);

      expect(inputOf(one).getAttribute('aria-valuetext')).to.equal('20 degrees');
      expect(inputOf(one).getAttribute('aria-label'), 'one thumb needs no second name').to.equal(
        null,
      );

      const two = await fixture<BkSlider>(html`
        <bk-slider
          value="20"
          value-end="80"
          value-text="20 degrees"
          value-text-end="80 degrees"
        ></bk-slider>
      `);

      expect(inputOf(two).getAttribute('aria-valuetext')).to.equal('20 degrees');
      expect(endInputOf(two)!.getAttribute('aria-valuetext')).to.equal('80 degrees');
      expect(inputOf(two).getAttribute('aria-label'), 'two sliders need two names').to.equal(
        'Minimum',
      );
      expect(endInputOf(two)!.getAttribute('aria-label')).to.equal('Maximum');
    });
  });

  describe('paint', () => {
    it('should leave the track alone under the pointer', async function () {
      if (!hoverCapable()) this.skip();

      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
      const before = getComputedStyle(railOf(el)).backgroundColor;

      await hover(railOf(el));

      expect(
        getComputedStyle(railOf(el)).backgroundColor,
        'the track is not a button: only the knob answers the pointer',
      ).to.equal(before);
    });

    it('should answer the pointer only over the knob, never over the track', async function () {
      if (!hoverCapable()) this.skip();

      const el = await fixture<BkSlider>(html`<bk-slider value="20"></bk-slider>`);
      const rail = el.shadowRoot!.querySelector('[part="track"]')!.getBoundingClientRect();
      const input = el.shadowRoot!.querySelector('input')!;
      const knob = Math.min(input.offsetWidth, input.offsetHeight);
      const middle = Math.round(rail.top + rail.height / 2);

      await sendMouse({ type: 'move', position: [Math.round(rail.right - 20), middle] });
      await el.updateComplete;

      expect(
        input.hasAttribute('data-knob'),
        'the pointer is over the track, which is not the knob',
      ).to.equal(false);

      const centre = rail.left + knob / 2 + 0.2 * (rail.width - knob);
      await sendMouse({ type: 'move', position: [Math.round(centre), middle] });
      await el.updateComplete;

      expect(input.hasAttribute('data-knob'), 'the knob answers for itself').to.equal(true);

      const rule = [...el.shadowRoot!.adoptedStyleSheets]
        .flatMap((sheet) => [...sheet.cssRules].map((entry) => entry.cssText))
        .find((text) => text.includes('::-webkit-slider-thumb {') && text.includes('halo'));

      expect(rule, 'and the halo keys on that answer').to.contain('[data-knob]');
      expect(rule).to.contain('--bk-focus-halo');
      expect(rule).to.contain('--bk-slider-halo-size');
    });

    it('should paint the fill with the accent role', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="60"></bk-slider>`);

      expect(getComputedStyle(fillOf(el)).backgroundColor).to.equal(
        await colorOf('var(--bk-bg-accent)'),
      );
    });

    it('should paint the geometry through the three hooks', async () => {
      document.documentElement.style.setProperty('--bk-slider-track-height', '12px');
      document.documentElement.style.setProperty('--bk-slider-thumb-size', '24px');
      document.documentElement.style.setProperty('--bk-slider-radius', '12px');
      const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
      const rail = railOf(el);

      expect(rail.getBoundingClientRect().height, 'the track hook is the painted track').to.equal(
        12,
      );
      expect(getComputedStyle(rail).borderTopLeftRadius, 'the radius hook').to.equal('12px');
      expect(inputOf(el).getBoundingClientRect().height, 'the thumb hook sizes the input').to.equal(
        24,
      );
      expect(
        paintOf(ruleOf(el, '::-webkit-slider-thumb'), 'inline-size'),
        'and the pseudo-element reads the same hook',
      ).to.contain('--bk-slider-thumb-size');
    });

    it('should draw the focus ring on the thumb for keyboard focus', async () => {
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button><bk-slider>${labelAtom('Volume')}</bk-slider>
        </div>
      `);
      const el = host.querySelector<BkSlider>('bk-slider')!;
      const ring = ruleOf(el, ':focus-visible::-webkit-slider-thumb');

      expect(paintOf(ring, 'outline'), 'the ring is painted for keyboard focus').to.contain(
        'solid',
      );
      expect(
        paintOf(ring, 'outline').includes('var(--bk-focus-ring)'),
        'and reads the ring roles',
      ).to.equal(true);

      (host.querySelector('button') as HTMLElement).focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();

      expect(inputOf(el).matches(':focus-visible'), 'and a key reaches the thumb').to.equal(true);
    });

    it('should draw no ring when the pointer reaches the slider', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider>${labelAtom('Volume')}</bk-slider>`);

      await clickAt(railOf(el));
      await el.updateComplete;

      expect(inputOf(el).matches(':focus'), 'the click focused the input').to.equal(true);
      expect(
        inputOf(el).matches(':focus-visible'),
        'a pointer click is not keyboard focus',
      ).to.equal(false);
    });

    it('should dim the track while disabled and keep it off the pointer', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider disabled></bk-slider>`);

      expect(getComputedStyle(railOf(el)).opacity, 'one dim, at the rail').to.equal(
        opacityOf('var(--bk-opacity-disabled)'),
      );
    });
  });

  describe('contrast', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should keep the track at 3:1 against the surface (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);

        expect(
          contrastRatio(
            getComputedStyle(railOf(el)).backgroundColor,
            await colorOf('var(--bk-bg-surface)'),
          ),
          'a flat boundary has to read against the surface on its own',
        ).to.be.at.least(3);
      });

      it(`should separate the knob from the track with its edge (${theme})`, async () => {
        setTheme(theme);
        clearStyleCache();
        const el = await fixture<BkSlider>(html`<bk-slider value="40" value-end="80"></bk-slider>`);
        const rule = ruleOf(el, '::-webkit-slider-thumb');
        const edge = await colorOf(
          paintOf(rule, 'border').match(/solid\s+(var\(--bk-[a-z-]+\))/)![1],
        );
        const knob = await colorOf(paintOf(rule, 'background'));
        const rail = getComputedStyle(railOf(el)).backgroundColor;

        expect(
          contrastRatio(edge, rail),
          'the edge against the unfilled track the knob caps',
        ).to.be.at.least(3);
        expect(contrastRatio(edge, knob), 'and against the knob it wraps').to.be.at.least(3);
        expect(
          contrastRatio(knob, await colorOf('var(--bk-bg-surface)')),
          'the knob against the page it overflows onto',
        ).to.be.at.least(3);
        expect(
          contrastRatio(knob, getComputedStyle(fillOf(el)).backgroundColor),
          'the knob is the run colour by design, which is why the edge carries the separation',
        ).to.be.below(3);
      });

      it(`should resolve the halo for the theme (${theme})`, async () => {
        setTheme(theme);
        clearStyleCache();
        const el = await fixture<BkSlider>(html`<bk-slider value="40"></bk-slider>`);
        const halo = await colorOf('var(--bk-focus-halo)');

        expect(halo, 'the halo is translucent in both themes').to.contain('0.');
        expect(el.shadowRoot!.querySelector('[part="fill"]')).to.not.equal(null);
      });

      it(`should keep the fill at 3:1 against the surface (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`<bk-slider value="60"></bk-slider>`);

        expect(
          contrastRatio(
            getComputedStyle(fillOf(el)).backgroundColor,
            await colorOf('var(--bk-bg-surface)'),
          ),
        ).to.be.at.least(3);
      });

      it(`should keep the focus ring at 3:1 against the surface (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`<bk-slider></bk-slider>`);
        const ring = ruleOf(el, ':focus-visible::-webkit-slider-thumb');

        expect(
          contrastRatio(
            await colorOf('var(--bk-focus-ring)'),
            await colorOf('var(--bk-bg-surface)'),
          ),
          `the ring the rule paints is the role the kit resolves (${paintOf(ring, 'outline')})`,
        ).to.be.at.least(3);
      });

      it(`should keep the ticks readable against the rail (${theme})`, async () => {
        setTheme(theme);
        clearStyleCache();
        const el = await fixture<BkSlider>(html`
          <bk-slider ticks min="0" max="4" step="1" value="2"></bk-slider>
        `);
        const tick = getComputedStyle(ticksOf(el)[0]!);

        expect(Boolean(ticksLayerOf(el)), 'the ticks rendered').to.equal(true);
        expect(
          contrastRatio(tick.backgroundColor, getComputedStyle(railOf(el)).backgroundColor),
          'a mark on the rail clears 3:1 against it',
        ).to.be.at.least(3);
        expect(tick.backgroundColor, 'and the role that does it').to.equal(
          await colorOf('var(--bk-bg-surface)'),
        );
      });

      it(`should paint the readout with the inverse pair (${theme})`, async () => {
        setTheme(theme);
        clearStyleCache();
        const el = await fixture<BkSlider>(
          html`<bk-slider tooltip="always" value="40" value-text="40 %"></bk-slider>`,
        );
        const readout = getComputedStyle(readoutOf(el)!);

        expect(readout.backgroundColor, 'the bubble is the inverse surface').to.equal(
          await colorOf('var(--bk-bg-inverse)'),
        );
        expect(readout.color, 'and the inverse text paints on it').to.equal(
          await colorOf('var(--bk-text-inverse)'),
        );
        expect(
          contrastRatio(readout.color, readout.backgroundColor),
          'text on the bubble',
        ).to.be.at.least(4.5);
        expect(
          contrastRatio(readout.backgroundColor, await colorOf('var(--bk-bg-surface)')),
          'and the bubble against the page it floats over, so it needs no border to be seen',
        ).to.be.at.least(3);
      });
    }
  });

  describe('error', () => {
    it('should show the error, mark both inputs invalid and colour the message', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="20" value-end="80"></bk-slider>`);
      const error = 'Set the range to under a quarter.';

      el.error = error;
      await el.updateComplete;

      expect(errorOf(el).textContent!.trim()).to.equal(error);
      for (const input of inputsOf(el)) {
        expect(input.getAttribute('aria-invalid')).to.equal('true');
      }
      expect(getComputedStyle(errorOf(el)).color).to.equal(await colorOf('var(--bk-text-danger)'));
      expect(labelOf(el).getAttribute('data-state')).to.equal('invalid');
      expect(el.validity.customError).to.equal(true);
    });

    it('should block a submit on the error and clear it on input', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="volume" error="Set the range to under a quarter."></bk-slider></form>
      `);
      const el = form.querySelector<BkSlider>('bk-slider')!;
      await el.updateComplete;
      const watch = watchSubmit(form);

      form.requestSubmit();
      await el.updateComplete;

      expect(watch.invalidOrder[0] === el, 'the error blocks the submit').to.equal(true);
      expect(watch.count).to.equal(0);

      inputOf(el).focus();
      await sendKeys({ press: 'ArrowRight' });
      await el.updateComplete;

      expect(el.error, 'a value clears the message it was about').to.equal('');
      expect(inputOf(el).getAttribute('aria-invalid')).to.equal(null);
    });
  });

  describe('form participation', () => {
    it('should submit the value of one thumb as a plain string', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="volume" value="40"></bk-slider></form>
      `);

      expect(formData(form).get('volume'), 'no delimiter and no suffix').to.equal('40');
      expect(formData(form).getAll('volume').length).to.equal(1);
    });

    it('should submit both thumbs under the same name for getAll', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="price" value="20" value-end="80"></bk-slider></form>
      `);

      expect(
        formData(form).getAll('price'),
        'repeated keys, the way the libraries do it',
      ).to.deep.equal(['20', '80']);
    });

    it('should submit nothing while disabled and ask nothing of the form', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="volume" value="40" disabled></bk-slider></form>
      `);
      const el = form.querySelector<BkSlider>('bk-slider')!;
      await el.updateComplete;

      expect(formData(form).get('volume')).to.equal(null);
      expect(el.validity.valid).to.equal(true);
    });

    it('should keep the native disabled attribute and refuse the keyboard', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="40" disabled></bk-slider>`);
      const input = inputOf(el);

      expect(
        input.hasAttribute('disabled'),
        'a range is a field: the attribute is the rule',
      ).to.equal(true);
      expect(input.matches(':disabled')).to.equal(true);

      el.focus();
      await nextFrame();
      await sendKeys({ press: 'ArrowRight' });
      await el.updateComplete;

      expect(el.value, 'the platform refuses the key too').to.equal(40);
      expect(input.value).to.equal('40');
    });

    it('should restore the authored value and value-end on reset', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form><bk-slider name="price" value="20" value-end="80"></bk-slider></form>
      `);
      const el = form.querySelector<BkSlider>('bk-slider')!;

      el.value = 50;
      el.valueEnd = 60;
      el.error = 'Set the range to under a quarter.';
      await el.updateComplete;

      form.reset();
      await el.updateComplete;

      expect(el.value, 'the attribute is the state the form returns to').to.equal(20);
      expect(el.valueEnd).to.equal(80);
      expect(inputOf(el).value).to.equal('20');
      expect(endInputOf(el)!.value).to.equal('80');
      expect(el.error, 'a reset clears the error').to.equal('');
    });

    it('should submit nothing while a disabled fieldset disables it', async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form>
          <fieldset disabled><bk-slider name="price" value="30"></bk-slider></fieldset>
        </form>
      `);
      const el = form.querySelector<BkSlider>('bk-slider')!;
      await settle(el);

      expect(
        new FormData(form).get('price'),
        'a field the fieldset disabled must not submit, as every other field here',
      ).to.equal(null);
    });
  });

  describe('paint', () => {
    it('should keep the run inside the track in both orientations', async () => {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        const el = await fixture<BkSlider>(
          html`<bk-slider value="30" orientation=${orientation}></bk-slider>`,
        );
        const rail = el.shadowRoot!.querySelector('[part="track"]')!.getBoundingClientRect();
        const fill = el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect();

        expect(
          fill.width,
          `the run never grows wider than the track (${orientation})`,
        ).to.be.at.most(rail.width + 0.5);
        expect(fill.height).to.be.at.most(rail.height + 0.5);
        el.remove();
      }
    });

    it('should start the run at the rail edge, never at the thumb centre', async () => {
      const el = await fixture<BkSlider>(html`<bk-slider value="40"></bk-slider>`);
      const rail = el.shadowRoot!.querySelector('[part="track"]')!.getBoundingClientRect();
      const fill = el.shadowRoot!.querySelector('[part="fill"]')!.getBoundingClientRect();

      expect(fill.left, 'no nub of track before the run').to.equal(rail.left);
      expect(fill.right, 'and it ends under the thumb').to.be.lessThan(rail.right);
    });

    it('should ring the thumb so it reads against the page', async () => {
      for (const theme of ['light', 'dark'] as const) {
        setTheme(theme);
        const el = await fixture<BkSlider>(html`<bk-slider value="40"></bk-slider>`);
        const rule = [...el.shadowRoot!.adoptedStyleSheets]
          .flatMap((sheet) => [...sheet.cssRules].map((entry) => entry.cssText))
          .find((text) => text.includes('::-webkit-slider-thumb {'));

        expect(rule, 'the thumb rule is the one with an edge').to.contain('border');
        expect(rule).to.contain('--bk-border-on-accent');
        expect(
          contrastRatio(
            await colorOf('var(--bk-border-on-accent)'),
            getComputedStyle(el.shadowRoot!.querySelector('[part="track"]')!).backgroundColor,
          ),
          `the edge clears 3:1 against the track it caps (${theme})`,
        ).to.be.at.least(3);
      }
    });
  });
});
