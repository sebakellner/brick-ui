import { settle } from '@brikka-ui/test-utils/settle.js';
import { resetMouse, sendKeys } from '@web/test-runner-commands';
import { labelAtom } from '@brikka-ui/test-utils/atoms.js';
import { contrastRatio } from '@brikka-ui/test-utils/contrast.js';
import { colorOf, opacityOf } from '@brikka-ui/test-utils/style.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { expectNoViolations, expectRendered } from '@brikka-ui/test-utils/a11y.js';
import '.././define.js';
import '../../brikka-field/define.js';
import type { BrikkaRadioGroup } from '.././brikka-radio-group.js';
import type { BrikkaRadioGroupItem } from '.././brikka-radio-group-item.js';
import { clickAt, hover, hoverCapable } from '@brikka-ui/test-utils/pointer.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

const innerInput = (el: BrikkaRadioGroupItem) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BrikkaRadioGroupItem) => el.shadowRoot!.querySelector('label')!;
const innerBox = (el: BrikkaRadioGroupItem) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;
const innerDescription = (el: BrikkaRadioGroupItem) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;

describe('brikka-radio-group-item', () => {
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--brikka-radio-group-item-size');
    document.documentElement.style.removeProperty('--brikka-radio-group-item-radius');
    setTheme('light');
  });

  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const group = await fixture<BrikkaRadioGroup>(html`
          <brikka-radio-group value="m">
            <brikka-field-label slot="label">Size</brikka-field-label>
            <brikka-radio-group-item value="s">
              <brikka-field-label slot="label">Small</brikka-field-label>
            </brikka-radio-group-item>
            <brikka-radio-group-item value="m">
              <brikka-field-label slot="label">Medium</brikka-field-label>
            </brikka-radio-group-item>
          </brikka-radio-group>
        `);
        await settle(group);
        const el = group.querySelector<BrikkaRadioGroupItem>('brikka-radio-group-item')!;

        expectRendered(el, 'input');
        await expectNoViolations(el);
      });
    }
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the box boundary at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaRadioGroupItem>(
        html`<brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>`,
      );
      const box = getComputedStyle(innerBox(el));

      expect(contrastRatio(box.borderTopColor, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the dot at 3:1 against the box it sits in (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BrikkaRadioGroupItem>(
        html`<brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>`,
      );
      el.checked = true;
      await el.updateComplete;
      const box = getComputedStyle(innerBox(el));
      const dot = getComputedStyle(innerBox(el), '::after');

      expect(dot.visibility, 'the selected box draws its dot').to.equal('visible');
      expect(contrastRatio(dot.color, box.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against the surface it sits on (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>
        </div>
      `);
      const el = host.querySelector<BrikkaRadioGroupItem>('brikka-radio-group-item')!;
      el.tabStop = true;
      await el.updateComplete;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const box = getComputedStyle(innerBox(el));

      expect(box.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(box.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(
        contrastRatio(box.outlineColor, await colorOf('var(--brikka-bg-surface)')),
      ).to.be.at.least(3);
    });
  }

  it('should render a label that points at and contains the inner radio', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>`,
    );
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
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item></brikka-radio-group-item>`,
    );
    const input = innerInput(el);

    expect(Boolean(input), 'the radio renders a native control').to.equal(true);

    el.focus();

    expect(el.shadowRoot!.activeElement === input).to.equal(true);
  });

  it('should follow the checked property on the inner radio', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item checked></brikka-radio-group-item>`,
    );

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
      <div><brikka-radio-group-item value="a">${labelAtom('Email')}</brikka-radio-group-item></div>
    `);
    const el = host.querySelector<BrikkaRadioGroupItem>('brikka-radio-group-item')!;
    const details: unknown[] = [];
    host.addEventListener('brikka-change', (event) => {
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
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item disabled>${labelAtom('Email')}</brikka-radio-group-item>`,
    );
    const input = innerInput(el);
    let changes = 0;
    el.addEventListener('brikka-change', () => {
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

  it('should dim the row of a disabled radio and leave the box surface alone', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item disabled>${labelAtom('Email')}</brikka-radio-group-item>`,
    );

    expect(
      getComputedStyle(innerBox(el)).backgroundColor,
      'the box keeps the surface role',
    ).to.equal(await colorOf('var(--brikka-bg-surface)'));
    expect(
      innerLabel(el).hasAttribute('data-disabled'),
      'the row states that it is disabled',
    ).to.equal(true);
    expect(getComputedStyle(innerLabel(el)).opacity, 'the row carries the dim').to.equal(
      await opacityOf('var(--brikka-opacity-disabled)'),
    );
  });

  it('should keep the box border strong while an enabled radio is hovered', async function () {
    if (!hoverCapable()) this.skip();

    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>`,
    );
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

  it('should change nothing under the pointer while the radio is disabled', async function () {
    if (!hoverCapable()) this.skip();

    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-radio-group-item disabled>${labelAtom('Email')}</brikka-radio-group-item>
        <brikka-radio-group-item>${labelAtom('Email')}</brikka-radio-group-item>
      </div>
    `);
    const [disabled, enabled] =
      host.querySelectorAll<BrikkaRadioGroupItem>('brikka-radio-group-item');
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
    expect(getComputedStyle(box).borderTopColor, 'a disabled radio has no hover border').to.equal(
      borderBefore,
    );
    expect(getComputedStyle(box).backgroundColor, 'nor a hover background').to.equal(
      backgroundBefore,
    );
  });

  it('should take the disabled opacity from the shared primitive', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item disabled>${labelAtom('Email')}</brikka-radio-group-item>`,
    );
    el.style.setProperty('--brikka-opacity-disabled', '0.25');

    expect(getComputedStyle(innerLabel(el)).opacity).to.equal('0.25');
  });

  it('should move the inner tab stop with the tabStop property alone', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item></brikka-radio-group-item>`,
    );

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
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item></brikka-radio-group-item>`,
    );
    const box = innerBox(el);
    const size = box.getBoundingClientRect().width;

    expect(size).to.be.greaterThan(0);
    expect(
      parseFloat(getComputedStyle(box).borderTopLeftRadius),
      'a radio is round, not square',
    ).to.be.at.least(size / 2);

    document.documentElement.style.setProperty('--brikka-radio-group-item-size', '24px');
    document.documentElement.style.setProperty('--brikka-radio-group-item-radius', '0');
    await el.updateComplete;

    const styled = getComputedStyle(box);

    expect(styled.width, 'the size hook paints the box').to.equal('24px');
    expect(styled.borderTopLeftRadius, 'the radius hook paints the corner').to.equal('0px');
  });

  it('should take a description from its own atom and align it with the label text', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(html`
      <brikka-radio-group-item value="s">
        <brikka-field-label slot="label">Small</brikka-field-label>
        <brikka-field-description>Fits most people.</brikka-field-description>
      </brikka-radio-group-item>
    `);
    await settle(el);
    const atom = el.querySelector('brikka-field-description')!;
    const regionSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="description"]')!;
    const label = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const box = innerBox(el).getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(
      atom.getAttribute('slot'),
      'the item writes the slot, the consumer markup does not',
    ).to.equal('description');
    expect(
      regionSlot.assignedElements().includes(atom),
      'the atom is the region of the item',
    ).to.equal(true);
    expect(box.left, 'the box starts the row').to.be.lessThan(label.left);
    expect(description.top, 'the description sits under the label row').to.be.at.least(
      label.bottom,
    );
    expect(
      Math.abs(description.left - label.left),
      'the description is indented by the box and the row gap, not rendered under the box',
    ).to.be.at.most(1);
  });

  it('should keep the description aligned when the box is resized', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(html`
      <brikka-radio-group-item value="s">
        <brikka-field-label slot="label">Small</brikka-field-label>
        <brikka-field-description>Fits most people.</brikka-field-description>
      </brikka-radio-group-item>
    `);
    await settle(el);
    const before = innerDescription(el).getBoundingClientRect().left;

    el.style.setProperty('--brikka-radio-group-item-size', '24px');
    await settle(el);

    const label = el.querySelector('brikka-field-label')!.getBoundingClientRect();
    const description = innerDescription(el).getBoundingClientRect();

    expect(description.left, 'the indent follows the size hook').to.be.greaterThan(before);
    expect(
      Math.abs(description.left - label.left),
      'a resized box keeps the description on the label text',
    ).to.be.at.most(1);
  });

  it('should add no vertical space while it carries no description', async () => {
    const host = await fixture<HTMLElement>(html`
      <div>
        <brikka-radio-group-item value="s">
          <brikka-field-label slot="label">Small</brikka-field-label>
          <brikka-field-description>Fits most people.</brikka-field-description>
        </brikka-radio-group-item>
        <brikka-radio-group-item value="m">
          <brikka-field-label slot="label">Medium</brikka-field-label>
        </brikka-radio-group-item>
        <div class="after"></div>
      </div>
    `);
    const [withHint, withoutHint] =
      host.querySelectorAll<BrikkaRadioGroupItem>('brikka-radio-group-item');
    await settle(withHint);
    await settle(withoutHint);

    const marker = host.querySelector<HTMLElement>('.after')!;
    const row = innerLabel(withoutHint).getBoundingClientRect();
    const below = () =>
      marker.getBoundingClientRect().top - withoutHint.getBoundingClientRect().bottom;

    expect(
      getComputedStyle(innerDescription(withoutHint)).display,
      'no region is laid out',
    ).to.equal('none');
    expect(withoutHint.getBoundingClientRect().height, 'the item is exactly its row').to.be.at.most(
      row.height + 1,
    );
    expect(below(), 'nothing is left below it in the column').to.be.at.most(1);
    expect(
      withHint.getBoundingClientRect().height,
      'the radio beside it, which has a description, is taller',
    ).to.be.greaterThan(withoutHint.getBoundingClientRect().height);

    const empty = document.createElement('brikka-field-description');
    withoutHint.append(empty);
    await settle(withoutHint);

    expect(below(), 'an empty description takes no space either').to.be.at.most(1);

    empty.textContent = 'Added later.';
    await settle(withoutHint);

    expect(
      withoutHint.getBoundingClientRect().height,
      'the text is what takes the space, inside the item',
    ).to.be.greaterThan(row.height + 1);
    expect(below(), 'and nothing is left below it').to.be.at.most(1);
  });

  it('should describe the radio with its own hint and drop the reference while it is empty', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(
      html`<brikka-radio-group-item
        ><brikka-field-label slot="label">Priority</brikka-field-label></brikka-radio-group-item
      >`,
    );
    await settle(el);

    expect(innerInput(el).hasAttribute('aria-describedby'), 'no hint, no reference').to.equal(
      false,
    );

    const hint = document.createElement('brikka-field-description');
    hint.textContent = 'Ships first.';
    el.append(hint);
    await settle(el);

    const resolved = el.shadowRoot!.getElementById(
      innerInput(el).getAttribute('aria-describedby')!,
    );
    expect(
      Boolean(resolved) && resolved === innerDescription(el),
      'the reference resolves to the hint region in the same tree',
    ).to.equal(true);
  });

  it('should not describe the radio with an atom nothing projects', async () => {
    const el = await fixture<BrikkaRadioGroupItem>(html`
      <brikka-radio-group-item>
        <brikka-field-label slot="label">Priority</brikka-field-label>
        <div><brikka-field-description>Ships first.</brikka-field-description></div>
      </brikka-radio-group-item>
    `);
    await settle(el);

    expect(
      innerInput(el).hasAttribute('aria-describedby'),
      'text the item owns but cannot project does not describe it',
    ).to.equal(false);
    expect(
      getComputedStyle(innerDescription(el)).display,
      'and the region stays collapsed',
    ).to.equal('none');
  });
});
