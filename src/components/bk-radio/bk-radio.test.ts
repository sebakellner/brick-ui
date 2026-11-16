import { expect, fixture, html } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';
import './define.js';
import '../bk-field/define.js';
import type { BkRadio } from './bk-radio.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkRadio) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkRadio) => el.shadowRoot!.querySelector('label')!;
const innerBox = (el: BkRadio) => el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;

const clickAt = async (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  await sendMouse({
    type: 'click',
    position: [Math.round(x + width / 2), Math.round(y + height / 2)],
  });
};

const labelAtom = html`<bk-field-label slot="label">Email</bk-field-label>`;

describe('bk-radio', () => {
  before(loadTheme);

  afterEach(() => {
    document.documentElement.style.removeProperty('--bk-radio-size');
    document.documentElement.style.removeProperty('--bk-radio-radius');
    setTheme('light');
  });

  it('should render a label that points at and contains the inner radio', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio>${labelAtom}</bk-radio>`);
    const input = innerInput(el);
    const label = innerLabel(el);

    expect(label.htmlFor).to.equal(input.id);
    expect(input.id).to.not.equal('');
    expect(input.type).to.equal('radio');
    expect(input.closest('label') === label, 'the input is inside the label it names').to.equal(
      true,
    );
    expect(
      Boolean(label.querySelector('slot[name="label"]')),
      'the label slot is inside the label',
    ).to.equal(true);
  });

  it('should delegate focus to the inner radio', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio></bk-radio>`);
    const input = innerInput(el);

    expect(Boolean(input), 'the radio renders a native control').to.equal(true);

    el.focus();

    expect(el.shadowRoot!.activeElement === input).to.equal(true);
  });

  it('should follow the checked property on the inner radio', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio checked></bk-radio>`);

    expect(el.checked, 'the attribute is the property').to.equal(true);
    expect(innerInput(el).checked, 'the markup reaches the native control').to.equal(true);

    el.checked = false;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(false);

    el.checked = true;
    await el.updateComplete;

    expect(innerInput(el).checked).to.equal(true);
  });

  it('should report an activation and leave the selection to the group', async () => {
    const host = await fixture<HTMLElement>(html`
      <div><bk-radio value="a">${labelAtom}</bk-radio></div>
    `);
    const el = host.querySelector<BkRadio>('bk-radio')!;
    const details: unknown[] = [];
    host.addEventListener('bk-change', (event) => {
      details.push((event as CustomEvent).detail);
    });

    await clickAt(innerBox(el));
    await el.updateComplete;

    expect(details, 'one report per activation, bubbling out of the radio').to.deep.equal([
      { checked: true },
    ]);
    expect(el.checked, 'the radio does not select itself').to.equal(false);
    expect(
      innerInput(el).checked,
      'the next update re-syncs the native control from the property',
    ).to.equal(false);
  });

  it('should refuse to activate while disabled and stay focusable', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio disabled>${labelAtom}</bk-radio>`);
    const input = innerInput(el);
    let changes = 0;
    el.addEventListener('bk-change', () => {
      changes += 1;
    });

    await clickAt(innerBox(el));
    await el.updateComplete;

    expect(input.getAttribute('aria-disabled')).to.equal('true');
    expect(input.hasAttribute('disabled'), 'the native attribute stays off').to.equal(false);
    expect(input.disabled).to.equal(false);
    expect(el.checked).to.equal(false);
    expect(input.checked).to.equal(false);
    expect(changes).to.equal(0);

    el.focus();
    expect(el.shadowRoot!.activeElement === input).to.equal(true);
  });

  it('should move the inner tab stop with the tabStop property alone', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio></bk-radio>`);

    expect(innerInput(el).getAttribute('tabindex'), 'no tab stop until the group says so').to.equal(
      '-1',
    );

    el.tabStop = true;
    await el.updateComplete;

    expect(innerInput(el).getAttribute('tabindex')).to.equal('0');
    expect(el.hasAttribute('tabstop'), 'the tab stop is a property, not an attribute').to.equal(
      false,
    );

    el.tabStop = false;
    await el.updateComplete;

    expect(innerInput(el).getAttribute('tabindex')).to.equal('-1');
  });

  it('should paint a round box whose radius comes from the hook', async () => {
    const el = await fixture<BkRadio>(html`<bk-radio></bk-radio>`);
    const box = innerBox(el);
    const size = box.getBoundingClientRect().width;

    expect(size).to.be.greaterThan(0);
    expect(
      parseFloat(getComputedStyle(box).borderTopLeftRadius),
      'a radio is round, not square',
    ).to.be.at.least(size / 2);

    document.documentElement.style.setProperty('--bk-radio-size', '24px');
    document.documentElement.style.setProperty('--bk-radio-radius', '0');
    await el.updateComplete;

    const styled = getComputedStyle(box);

    expect(styled.width, 'the size hook paints the box').to.equal('24px');
    expect(styled.borderTopLeftRadius, 'the radius hook paints the corner').to.equal('0px');
  });
});
