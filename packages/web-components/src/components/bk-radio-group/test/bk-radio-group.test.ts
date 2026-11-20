import { settle as settleHost } from '@brick/test-utils/settle.js';
import { colorOf, opacityOf } from '@brick/test-utils/style.js';
import { describedNode } from '@brick/test-utils/dom.js';
import { watchSubmit } from '@brick/test-utils/form.js';
import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys, resetMouse } from '@web/test-runner-commands';
import '.././define.js';
import '../../bk-field/define.js';
import type { BkRadioGroupItem } from '.././bk-radio-group-item.js';
import type { BkRadioGroup } from '.././bk-radio-group.js';
import { expectNoViolations, expectRendered } from '@brick/test-utils/a11y.js';
import { clickAt } from '@brick/test-utils/pointer.js';
import { setTheme } from '@brick/test-utils/theme.js';

const radios = (el: BkRadioGroup) =>
  Array.from(el.querySelectorAll<BkRadioGroupItem>('bk-radio-group-item'));

const innerInput = (radio: BkRadioGroupItem) => radio.shadowRoot!.querySelector('input')!;

const box = (radio: BkRadioGroupItem) =>
  radio.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;

const tabIndex = (radio: BkRadioGroupItem) => innerInput(radio).getAttribute('tabindex');

/* The group writes on its item, so each item's own update has to commit too. */
const settle = async (el: BkRadioGroup) => {
  await settleHost(el);
  for (const radio of radios(el)) await settleHost(radio);
};

const threeRadios = html`
  <bk-radio-group name="size">
    <bk-field-label>Size</bk-field-label>
    <bk-radio-group-item value="s"
      ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
    >
    <bk-radio-group-item value="m"
      ><bk-field-label slot="label">Medium</bk-field-label></bk-radio-group-item
    >
    <bk-radio-group-item value="l"
      ><bk-field-label slot="label">Large</bk-field-label></bk-radio-group-item
    >
  </bk-radio-group>
`;

describe('bk-radio-group', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<HTMLElement>(html`
          <bk-radio-group value="m">
            <bk-field-label slot="label">Size</bk-field-label>
            <bk-radio-group-item value="s"
              ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
            >
            <bk-radio-group-item value="m"
              ><bk-field-label slot="label">Medium</bk-field-label></bk-radio-group-item
            >
          </bk-radio-group>
        `);

        await expectRendered(el, '[part="radios"]');
        await expectNoViolations(el);
      });
    }
  });
  afterEach(async () => {
    await resetMouse();
  });

  afterEach(() => {
    setTheme('light');
  });

  it('should be a radiogroup named by the slotted label atom', async () => {
    const el = await fixture<BkRadioGroup>(threeRadios);
    await settle(el);
    const label = el.querySelector<HTMLElement>(':scope > bk-field-label')!;
    const named = Array.from(el.ariaLabelledByElements ?? []);

    expect(el.getAttribute('role'), 'the host is the widget').to.equal('radiogroup');
    expect(named.length, 'exactly one element names the group').to.equal(1);
    expect(named[0] === label, 'the name is the consumer atom, not a copy').to.equal(true);

    const unlabelled = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-radio-group-item value="s"
          ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
        >
      </bk-radio-group>
    `);
    await settle(unlabelled);

    expect(
      Array.from(unlabelled.ariaLabelledByElements ?? []).length,
      'the label of a radio is the radio’s, never the name of the group',
    ).to.equal(0);
  });

  it('should leave a nested group’s label to that group', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="outer">
        <bk-radio-group name="inner">
          <bk-field-label>Inner</bk-field-label>
          <bk-radio-group-item value="s"
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
      </bk-radio-group>
    `);
    const inner = el.querySelector<BkRadioGroup>('bk-radio-group')!;
    await settle(el);
    await settle(inner);
    await settle(el);
    const label = inner.querySelector<HTMLElement>(':scope > bk-field-label')!;
    const named = (group: BkRadioGroup) => Array.from(group.ariaLabelledByElements ?? []);

    expect(named(el).length, 'the inner label does not name the outer group').to.equal(0);
    expect(named(inner).length, 'the inner label names the inner group').to.equal(1);
    expect(named(inner)[0] === label, 'by the consumer atom itself').to.equal(true);
  });

  it('should describe itself with the consumer atoms and render no region of its own', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s"
          ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
        >
        <bk-field-description>Pick the one you wear.</bk-field-description>
        <bk-field-error>Pick a size.</bk-field-error>
      </bk-radio-group>
    `);
    await settle(el);
    const description = el.querySelector<HTMLElement>(':scope > bk-field-description')!;
    const error = el.querySelector<HTMLElement>(':scope > bk-field-error')!;

    expect(Boolean(error.id), 'the group gives its atom an id').to.equal(true);
    expect(describedNode(el) === error, 'the error atom is the region').to.equal(true);
    expect(error.getAttribute('role'), 'the error atom is the live region').to.equal('status');
    expect(
      getComputedStyle(description).display,
      'the description gives the row to the error while it has text',
    ).to.equal('none');
    expect(
      Boolean(
        el.shadowRoot!.querySelector('[part="message"], [part="description"], [part="error"]'),
      ),
      'the group renders no message region of its own',
    ).to.equal(false);
    expect(
      Boolean(el.shadowRoot!.querySelector('slot[name="error"]')),
      'it only projects the consumer atom',
    ).to.equal(true);

    error.textContent = '';
    await settle(el);

    expect(
      describedNode(el) === description,
      'an empty error falls back to the description',
    ).to.equal(true);
    expect(getComputedStyle(description).display).to.not.equal('none');
  });

  it('should leave the description of a radio to that radio', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s">
          <bk-field-label slot="label">Small</bk-field-label>
          <bk-field-description>Fits most people.</bk-field-description>
        </bk-radio-group-item>
        <bk-field-description>Pick the one you wear.</bk-field-description>
      </bk-radio-group>
    `);
    await settle(el);
    const item = el.querySelector<BkRadioGroupItem>('bk-radio-group-item')!;
    const hint = item.querySelector<HTMLElement>(':scope > bk-field-description')!;
    const own = el.querySelector<HTMLElement>(':scope > bk-field-description')!;

    expect(describedNode(el) === own, 'the group describes itself with its own atom').to.equal(
      true,
    );
    expect(hint.id, 'the hint of a radio is not adopted: it is given no id').to.equal('');
    expect(
      hint.hasAttribute('data-empty'),
      'nor one the atom writes for itself: the hint has text',
    ).to.equal(false);
    expect(hint.getAttribute('slot'), 'the item owns the slot assignment of its own atom').to.equal(
      'description',
    );
  });

  it('should set its value and keep exactly one radio checked on an activation', async () => {
    const el = await fixture<BkRadioGroup>(threeRadios);
    await settle(el);
    const [small, medium] = radios(el);

    await clickAt(box(medium));
    await settle(el);

    expect(el.value).to.equal('m');
    expect(medium.checked, 'the activated radio is checked').to.equal(true);
    expect(innerInput(medium).checked, 'and so is its inner input').to.equal(true);
    expect(small.checked).to.equal(false);

    await clickAt(box(small));
    await settle(el);

    expect(el.value).to.equal('s');
    expect(small.checked).to.equal(true);
    expect(innerInput(small).checked).to.equal(true);
    expect(medium.checked, 'the previous radio is unchecked').to.equal(false);
    expect(innerInput(medium).checked, 'including its inner input').to.equal(false);
    expect(radios(el).filter((radio) => radio.checked).length, 'one selection').to.equal(1);
  });

  it('should submit the selected value and nothing while nothing is selected', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-radio-group name="size">
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item value="s"
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
          <bk-radio-group-item value="m"
            ><bk-field-label slot="label">Medium</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
        <bk-radio-group name="other">
          <bk-field-label>Other</bk-field-label>
          <bk-radio-group-item value="x"
            ><bk-field-label slot="label">X</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
      </form>
    `);
    const [first, second] = Array.from(form.querySelectorAll<BkRadioGroup>('bk-radio-group'));
    await settle(first);
    await settle(second);

    expect(new FormData(form).get('size'), 'an unselected group submits nothing').to.equal(null);
    expect(new FormData(form).get('other')).to.equal(null);

    await clickAt(box(radios(second)[0]));
    await settle(second);

    expect(new FormData(form).get('other')).to.equal('x');
    expect(new FormData(form).getAll('other').length, 'one value, one entry').to.equal(1);
    expect(new FormData(form).get('size')).to.equal(null);
  });

  it('should mark its label with a star while required', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size" required>
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s"
          ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
        >
      </bk-radio-group>
    `);
    await settle(el);
    const mark = el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');

    expect(Boolean(mark), 'a required group marks its label').to.equal(true);
    expect(mark!.textContent, 'the mark is a star').to.equal('*');
    expect(mark!.getAttribute('aria-hidden'), 'and decoration for the eye').to.equal('true');
    expect(getComputedStyle(mark!).color, 'painted with the danger role').to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
  });

  it('should submit nothing when its only radio carries no value', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-radio-group name="size">
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
      </form>
    `);
    const el = form.querySelector('bk-radio-group') as BkRadioGroup;
    await settle(el);
    const [radio] = radios(el);
    const details: unknown[] = [];
    el.addEventListener('bk-change', (event) => {
      details.push((event as CustomEvent).detail);
    });

    await clickAt(box(radio));
    await settle(el);

    expect(details, 'the click reached the radio').to.deep.equal([{ checked: true }]);
    expect(el.value, 'an empty value reads as nothing selected').to.equal('');
    expect(radio.checked, 'the group writes the selection back to nothing').to.equal(false);
    expect(new FormData(form).get('size'), 'and submits nothing').to.equal(null);
  });

  it('should report valueMissing, block the submit and show the message through the atom', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-radio-group name="size" required>
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item value="s"
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
      </form>
    `);
    const el = form.querySelector<BkRadioGroup>('bk-radio-group')!;
    await settle(el);
    const watch = watchSubmit(form);

    expect(el.validity.valueMissing).to.equal(true);
    expect(el.validationMessage, 'the fixed English default').to.equal('Please select an option.');
    expect(form.checkValidity()).to.equal(false);

    watch.invalidOrder.length = 0;
    form.requestSubmit();
    await settle(el);

    expect(watch.count).to.equal(0);
    expect(watch.invalidOrder[0] === el, 'the group is what the submit rejected').to.equal(true);
    expect(watch.invalidOrder.length, 'the check before the submit is not counted').to.equal(1);

    const error = document.createElement('bk-field-error');
    error.textContent = 'Pick a size.';
    el.append(error);
    await settle(el);

    expect(el.validity.valueMissing, 'still missing while nothing is selected').to.equal(true);
    expect(el.validationMessage, 'the atom text is the message').to.equal('Pick a size.');
    expect(describedNode(el) === error, 'and it is what the host points at').to.equal(true);
    expect(el.getAttribute('aria-invalid')).to.equal('true');

    await clickAt(box(radios(el)[0]));
    await settle(el);

    expect(el.validity.valueMissing, 'a selection satisfies the constraint').to.equal(false);
    expect(el.validity.customError, 'the atom still blocks a submit').to.equal(true);
    expect(form.checkValidity()).to.equal(false);

    error.remove();
    await settle(el);

    expect(el.validity.customError).to.equal(false);
    expect(form.checkValidity(), 'with the atom gone the form validates').to.equal(true);
    expect(el.getAttribute('aria-invalid')).to.equal(null);
  });

  it('should move focus and selection on both axes, wrap, jump and skip a disabled radio', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s"
          ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
        >
        <bk-radio-group-item value="m" disabled>
          <bk-field-label slot="label">Medium</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="l"
          ><bk-field-label slot="label">Large</bk-field-label></bk-radio-group-item
        >
      </bk-radio-group>
    `);
    await settle(el);
    const [small, medium, large] = radios(el);
    let prevented: boolean | null = null;
    const record = (event: KeyboardEvent) => {
      prevented = event.defaultPrevented;
    };
    document.addEventListener('keydown', record);

    try {
      small.focus();
      prevented = null;
      await sendKeys({ press: 'ArrowDown' });
      await settle(el);

      expect(document.activeElement === large, 'the arrows skip a disabled radio').to.equal(true);
      expect(el.value, 'and select the radio they land on').to.equal('l');
      expect(innerInput(large).checked).to.equal(true);
      expect(medium.checked).to.equal(false);
      expect(prevented, 'the arrow does not scroll the page').to.equal(true);

      await sendKeys({ press: 'ArrowRight' });
      await settle(el);

      expect(document.activeElement === small, 'the other axis goes the same way').to.equal(true);
      expect(el.value, 'wrapping at the end').to.equal('s');

      await sendKeys({ press: 'ArrowUp' });
      await settle(el);

      expect(document.activeElement === large, 'up wraps to the last enabled radio').to.equal(true);
      expect(el.value).to.equal('l');

      await sendKeys({ press: 'ArrowLeft' });
      await settle(el);

      expect(document.activeElement === small, 'left goes back').to.equal(true);
      expect(el.value).to.equal('s');

      await sendKeys({ press: 'End' });
      await settle(el);

      expect(document.activeElement === large).to.equal(true);
      expect(el.value).to.equal('l');

      await sendKeys({ press: 'Home' });
      await settle(el);

      expect(document.activeElement === small).to.equal(true);
      expect(el.value).to.equal('s');
      expect(radios(el).filter((radio) => radio.disabled && radio.checked).length).to.equal(0);
    } finally {
      document.removeEventListener('keydown', record);
    }
  });

  it('should keep one tab stop, on the selected radio or the first enabled one', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s" disabled>
          <bk-field-label slot="label">Small</bk-field-label>
        </bk-radio-group-item>
        <bk-radio-group-item value="m"
          ><bk-field-label slot="label">Medium</bk-field-label></bk-radio-group-item
        >
        <bk-radio-group-item value="l"
          ><bk-field-label slot="label">Large</bk-field-label></bk-radio-group-item
        >
      </bk-radio-group>
    `);
    await settle(el);
    const [small, medium, large] = radios(el);

    expect(tabIndex(small), 'a disabled radio is never the tab stop').to.equal('-1');
    expect(tabIndex(medium), 'nothing selected, so the first enabled radio').to.equal('0');
    expect(tabIndex(large)).to.equal('-1');

    await clickAt(box(large));
    await settle(el);

    expect(tabIndex(large), 'the selection takes the tab stop with it').to.equal('0');
    expect(tabIndex(medium)).to.equal('-1');

    el.disabled = true;
    await settle(el);

    expect(tabIndex(large), 'a disabled group keeps no tab stop').to.equal('-1');
    expect(tabIndex(medium)).to.equal('-1');
  });

  it('should disable every radio it owns and empty the form value', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-radio-group name="size">
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item value="s"
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
          <bk-radio-group-item value="m"
            ><bk-field-label slot="label">Medium</bk-field-label></bk-radio-group-item
          >
          <bk-radio-group-item value="l" disabled>
            <bk-field-label slot="label">Large</bk-field-label>
          </bk-radio-group-item>
        </bk-radio-group>
      </form>
    `);
    const el = form.querySelector<BkRadioGroup>('bk-radio-group')!;
    await settle(el);
    const [small, medium, large] = radios(el);

    await clickAt(box(medium));
    await settle(el);

    expect(new FormData(form).get('size')).to.equal('m');

    el.disabled = true;
    await settle(el);

    expect(el.hasAttribute('disabled'), 'the attribute reflects').to.equal(true);
    expect(
      radios(el).every((radio) => radio.disabled),
      'every radio the group owns is disabled',
    ).to.equal(true);
    expect(innerInput(small).getAttribute('aria-disabled'), 'and announces it').to.equal('true');
    expect(new FormData(form).get('size'), 'a disabled group submits nothing').to.equal(null);

    el.disabled = false;
    await settle(el);

    expect(small.disabled, 'the group gives back what it took').to.equal(false);
    expect(medium.disabled).to.equal(false);
    expect(large.disabled, 'a radio disabled on its own stays disabled').to.equal(true);
    expect(new FormData(form).get('size'), 'and the selection survives').to.equal('m');

    const fieldset = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <bk-radio-group name="size">
            <bk-field-label>Size</bk-field-label>
            <bk-radio-group-item value="s" checked>
              <bk-field-label slot="label">Small</bk-field-label>
            </bk-radio-group-item>
          </bk-radio-group>
        </fieldset>
      </form>
    `);
    const inherited = fieldset.querySelector<BkRadioGroup>('bk-radio-group')!;
    await settle(inherited);

    expect(inherited.fieldDisabled, 'a disabled fieldset reaches the group').to.equal(true);
    expect(radios(inherited)[0].disabled, 'and flows on to the radios the group owns').to.equal(
      true,
    );
    expect(
      new FormData(fieldset).get('size'),
      'a group disabled by its fieldset submits nothing either',
    ).to.equal(null);
  });

  it('should dim its own label row once while the group is disabled', async () => {
    const el = await fixture<BkRadioGroup>(html`
      <bk-radio-group name="size">
        <bk-field-label>Size</bk-field-label>
        <bk-radio-group-item value="s"
          ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
        >
      </bk-radio-group>
    `);
    await settle(el);
    const row = el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;

    expect(getComputedStyle(row).opacity, 'an enabled group paints the row fully').to.equal('1');

    el.disabled = true;
    await settle(el);

    expect(getComputedStyle(row).opacity, 'the group label dims with the primitive').to.equal(
      await opacityOf('var(--bk-opacity-disabled)'),
    );
    expect(
      getComputedStyle(el.querySelector('bk-field-label')!).opacity,
      'the hosted atom is dimmed by its row, not a second time on its own',
    ).to.equal('1');
    expect(
      getComputedStyle(radios(el)[0].shadowRoot!.querySelector('label')!).opacity,
      'and each radio row dims on its own',
    ).to.equal(await opacityOf('var(--bk-opacity-disabled)'));
  });

  it('should return the selection to the radio whose markup carried checked on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-radio-group name="size">
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item value="s"
            ><bk-field-label slot="label">Small</bk-field-label></bk-radio-group-item
          >
          <bk-radio-group-item value="m" checked>
            <bk-field-label slot="label">Medium</bk-field-label>
          </bk-radio-group-item>
          <bk-radio-group-item value="l"
            ><bk-field-label slot="label">Large</bk-field-label></bk-radio-group-item
          >
        </bk-radio-group>
      </form>
    `);
    const el = form.querySelector<BkRadioGroup>('bk-radio-group')!;
    await settle(el);
    const [small, medium, large] = radios(el);

    expect(el.value, 'the markup selects the radio').to.equal('m');
    expect(medium.checked).to.equal(true);
    expect(innerInput(medium).checked).to.equal(true);
    expect(tabIndex(medium)).to.equal('0');

    await clickAt(box(large));
    await settle(el);
    el.error = 'Pick a size.';
    await settle(el);

    expect(el.value).to.equal('l');
    expect(large.checked).to.equal(true);

    form.reset();
    await settle(el);

    expect(el.value, 'the authored selection comes back').to.equal('m');
    expect(medium.checked).to.equal(true);
    expect(innerInput(medium).checked).to.equal(true);
    expect(large.checked).to.equal(false);
    expect(innerInput(large).checked).to.equal(false);
    expect(tabIndex(medium), 'the tab stop follows the restored selection').to.equal('0');
    expect(tabIndex(large)).to.equal('-1');
    expect(el.error, 'the error state is cleared').to.equal('');
    expect(new FormData(form).get('size')).to.equal('m');
    expect(small.checked).to.equal(false);
  });

  it('should flow its radios in a column by default and in a row while horizontal', async () => {
    const el = await fixture<BkRadioGroup>(threeRadios);
    await settle(el);
    const flow = el.shadowRoot!.querySelector<HTMLElement>('[part="radios"]')!;
    const [small, medium] = radios(el);

    expect(el.getAttribute('orientation'), 'vertical is the default, reflected').to.equal(
      'vertical',
    );
    expect(getComputedStyle(flow).flexDirection).to.equal('column');
    expect(small.getBoundingClientRect().top, 'the radios are stacked').to.be.lessThan(
      medium.getBoundingClientRect().top,
    );

    el.orientation = 'horizontal';
    await settle(el);

    expect(el.getAttribute('orientation')).to.equal('horizontal');
    expect(getComputedStyle(flow).flexDirection).to.equal('row');
    expect(
      Math.abs(small.getBoundingClientRect().top - medium.getBoundingClientRect().top),
      'the radios sit on one row',
    ).to.be.lessThan(2);
  });
});
