/* One `form.reset()` crossing every widget. What the reset returns to is the platform's
 * contract — the attribute the author wrote, not the value the element happened to mount
 * with — and no component can state it alone: the diagnosis of a green suite here is
 * "one of four widgets forgot its `formResetCallback`", which is why the assembly, and
 * not the control, is the subject.
 *
 * The error half is asserted without awaiting a render: "cleared by the same event" is
 * the rule, and a reset that only looks clean on the next frame is the bug. */

import { expect, fixture, html } from '@open-wc/testing';
import { resetMouse } from '@web/test-runner-commands';
import '../../../src/components/brikka-input/define.js';
import '../../../src/components/brikka-checkbox/define.js';
import '../../../src/components/brikka-radio-group/define.js';
import '../../../src/components/brikka-native-select/define.js';
import '../../../src/components/brikka-field/define.js';
import type { BrikkaInput } from '../../../src/components/brikka-input/brikka-input.js';
import type { BrikkaCheckbox } from '../../../src/components/brikka-checkbox/brikka-checkbox.js';
import type { BrikkaRadioGroup } from '../../../src/components/brikka-radio-group/brikka-radio-group.js';
import type { BrikkaRadioGroupItem } from '../../../src/components/brikka-radio-group/brikka-radio-group-item.js';
import type { BrikkaNativeSelect } from '../../../src/components/brikka-native-select/brikka-native-select.js';
import { labelAtom } from '@brikka-ui/test-utils/atoms.js';
import { colorOf } from '@brikka-ui/test-utils/style.js';
import { clickAt } from '@brikka-ui/test-utils/pointer.js';
import { settle } from '@brikka-ui/test-utils/settle.js';

const innerInput = (el: BrikkaInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BrikkaInput) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
const innerBox = (el: BrikkaCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BrikkaNativeSelect) => el.shadowRoot!.querySelector('select')!;
const radios = (el: BrikkaRadioGroup) =>
  Array.from(el.querySelectorAll<BrikkaRadioGroupItem>('brikka-radio-group-item'));
const box = (radio: BrikkaRadioGroupItem) =>
  radio.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;

/* The group writes `checked` on its items, so each item commits its own update. */
const settleGroup = async (el: BrikkaRadioGroup) => {
  await settle(el);
  for (const radio of radios(el)) await settle(radio);
};

const type = async (el: BrikkaInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await settle(el);
};

const choose = async (el: BrikkaNativeSelect, value: string) => {
  const select = innerSelect(el);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await settle(el);
};

const submitted = (form: HTMLFormElement, name: string): string | null => {
  const value = new FormData(form).get(name);

  return value === null ? null : String(value);
};

describe('form reset', () => {
  afterEach(async () => {
    await resetMouse();
  });

  it('should return the input to its value attribute after a reset, not to the value it mounted with', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-input name="email" value="mounted@brikka.dev">${labelAtom('Email')}</brikka-input>
        <brikka-checkbox name="terms" checked>${labelAtom('Terms')}</brikka-checkbox>
      </form>
    `);
    const email = form.querySelector<BrikkaInput>('brikka-input')!;
    await settle(email);

    expect(innerInput(email).value, 'the field mounted with its attribute').to.equal(
      'mounted@brikka.dev',
    );

    await type(email, 'typed@brikka.dev');

    expect(submitted(form, 'email'), 'the interaction is what the form carries').to.equal(
      'typed@brikka.dev',
    );

    email.setAttribute('value', 'later@brikka.dev');
    await settle(email);

    form.reset();
    await settle(email);

    expect(email.value, 'the attribute is the default the reset reads').to.equal(
      'later@brikka.dev',
    );
    expect(innerInput(email).value, 'and the native control shows the restored default').to.equal(
      'later@brikka.dev',
    );
    expect(submitted(form, 'email'), 'the payload is the restored value').to.equal(
      'later@brikka.dev',
    );
  });

  it('should return the checkbox to its authored checked attribute on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-checkbox name="terms" checked>${labelAtom('Terms')}</brikka-checkbox>
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
      </form>
    `);
    const terms = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    await settle(terms);

    expect(innerBox(terms).checked, 'the authored box rendered checked').to.equal(true);

    innerBox(terms).click();
    await settle(terms);

    expect(terms.checked, 'the click unchecked the box').to.equal(false);
    expect(new FormData(form).has('terms'), 'and an unchecked box sends no entry').to.equal(false);

    form.reset();
    await settle(terms);

    expect(terms.checked, 'the authored checked attribute comes back').to.equal(true);
    expect(innerBox(terms).checked, 'and the native box is checked again').to.equal(true);
    expect(submitted(form, 'terms'), 'so the entry is back in the payload').to.equal('on');
  });

  it('should return the radio group to the radio whose markup carried checked on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-radio-group name="size">
          <brikka-field-label>Size</brikka-field-label>
          <brikka-radio-group-item value="s"
            ><brikka-field-label slot="label">Small</brikka-field-label></brikka-radio-group-item
          >
          <brikka-radio-group-item value="m" checked>
            <brikka-field-label slot="label">Medium</brikka-field-label>
          </brikka-radio-group-item>
          <brikka-radio-group-item value="l"
            ><brikka-field-label slot="label">Large</brikka-field-label></brikka-radio-group-item
          >
        </brikka-radio-group>
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
      </form>
    `);
    const group = form.querySelector<BrikkaRadioGroup>('brikka-radio-group')!;
    await settleGroup(group);
    const [small, medium, large] = radios(group);

    expect(group.value, 'the markup selects the radio').to.equal('m');
    expect(medium.checked, 'and only that radio is checked').to.equal(true);

    await clickAt(box(large));
    await settleGroup(group);

    expect(group.value, 'the click moved the selection').to.equal('l');
    expect(submitted(form, 'size'), 'and the payload follows it').to.equal('l');

    form.reset();
    await settleGroup(group);

    expect(group.value, 'the authored selection comes back').to.equal('m');
    expect(medium.checked, 'the authored radio is checked again').to.equal(true);
    expect(large.checked, 'and the one the user picked is not').to.equal(false);
    expect(small.checked).to.equal(false);
    expect(submitted(form, 'size'), 'the payload is the restored selection').to.equal('m');
  });

  it('should return the select to its placeholder on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <brikka-native-select-opt value="email">Email</brikka-native-select-opt>
          <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
        </brikka-native-select>
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
      </form>
    `);
    const select = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(select);

    expect(innerSelect(select).value, 'the placeholder is what the field mounts on').to.equal('');

    await choose(select, 'sms');

    expect(submitted(form, 'channel'), 'the chosen option is the entry').to.equal('sms');

    form.reset();
    await settle(select);

    expect(select.value, 'the field is back on its placeholder').to.equal('');
    expect(
      innerSelect(select).selectedIndex,
      'and the native select shows the placeholder option',
    ).to.equal(0);
    expect(new FormData(form).has('channel'), 'so the form carries no entry again').to.equal(false);
  });

  it('should clear the error state of every widget in the same reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
        <brikka-checkbox name="terms" checked>${labelAtom('Terms')}</brikka-checkbox>
        <brikka-radio-group name="size">
          <brikka-field-label>Size</brikka-field-label>
          <brikka-radio-group-item value="m" checked>
            <brikka-field-label slot="label">Medium</brikka-field-label>
          </brikka-radio-group-item>
        </brikka-radio-group>
        <brikka-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
        </brikka-native-select>
      </form>
    `);
    const email = form.querySelector<BrikkaInput>('brikka-input')!;
    const terms = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    const group = form.querySelector<BrikkaRadioGroup>('brikka-radio-group')!;
    const select = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(email);
    await settle(terms);
    await settleGroup(group);
    await settle(select);
    const controls = [email, terms, group, select];

    expect(Boolean(innerLabel(email)), 'the field rendered its label row').to.equal(true);

    for (const control of controls) control.error = 'Something is wrong.';
    for (const control of controls) await settle(control);

    for (const control of controls) {
      expect(control.fieldInvalid, `${control.tagName.toLowerCase()} carries the error`).to.equal(
        true,
      );
    }

    expect(
      getComputedStyle(innerLabel(email)).color,
      'the invalid row paints the danger role',
    ).to.equal(await colorOf('var(--brikka-text-danger)'));

    form.reset();

    for (const control of controls) {
      expect(
        control.error,
        `${control.tagName.toLowerCase()} drops its error in the reset itself`,
      ).to.equal('');
      expect(
        control.fieldInvalid,
        `${control.tagName.toLowerCase()} reports valid in the reset itself`,
      ).to.equal(false);
    }

    await settle(email);

    expect(
      getComputedStyle(innerLabel(email)).color,
      'and the row comes back to the default text role',
    ).to.equal(await colorOf('var(--brikka-text-default)'));
  });
});
