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
import '../../../src/components/bk-input/define.js';
import '../../../src/components/bk-checkbox/define.js';
import '../../../src/components/bk-radio-group/define.js';
import '../../../src/components/bk-native-select/define.js';
import '../../../src/components/bk-field/define.js';
import type { BkInput } from '../../../src/components/bk-input/bk-input.js';
import type { BkCheckbox } from '../../../src/components/bk-checkbox/bk-checkbox.js';
import type { BkRadioGroup } from '../../../src/components/bk-radio-group/bk-radio-group.js';
import type { BkRadioGroupItem } from '../../../src/components/bk-radio-group/bk-radio-group-item.js';
import type { BkNativeSelect } from '../../../src/components/bk-native-select/bk-native-select.js';
import { labelAtom } from '@brick/test-utils/atoms.js';
import { colorOf } from '@brick/test-utils/style.js';
import { clickAt } from '@brick/test-utils/pointer.js';
import { settle } from '@brick/test-utils/settle.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerLabel = (el: BkInput) => el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
const innerBox = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BkNativeSelect) => el.shadowRoot!.querySelector('select')!;
const radios = (el: BkRadioGroup) =>
  Array.from(el.querySelectorAll<BkRadioGroupItem>('bk-radio-group-item'));
const box = (radio: BkRadioGroupItem) =>
  radio.shadowRoot!.querySelector<HTMLElement>('[part="box"]')!;

/* The group writes `checked` on its items, so each item commits its own update. */
const settleGroup = async (el: BkRadioGroup) => {
  await settle(el);
  for (const radio of radios(el)) await settle(radio);
};

const type = async (el: BkInput, value: string) => {
  const field = innerInput(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await settle(el);
};

const choose = async (el: BkNativeSelect, value: string) => {
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
        <bk-input name="email" value="mounted@brick.dev">${labelAtom('Email')}</bk-input>
        <bk-checkbox name="terms" checked>${labelAtom('Terms')}</bk-checkbox>
      </form>
    `);
    const email = form.querySelector<BkInput>('bk-input')!;
    await settle(email);

    expect(innerInput(email).value, 'the field mounted with its attribute').to.equal(
      'mounted@brick.dev',
    );

    await type(email, 'typed@brick.dev');

    expect(submitted(form, 'email'), 'the interaction is what the form carries').to.equal(
      'typed@brick.dev',
    );

    email.setAttribute('value', 'later@brick.dev');
    await settle(email);

    form.reset();
    await settle(email);

    expect(email.value, 'the attribute is the default the reset reads').to.equal('later@brick.dev');
    expect(innerInput(email).value, 'and the native control shows the restored default').to.equal(
      'later@brick.dev',
    );
    expect(submitted(form, 'email'), 'the payload is the restored value').to.equal(
      'later@brick.dev',
    );
  });

  it('should return the checkbox to its authored checked attribute on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" checked>${labelAtom('Terms')}</bk-checkbox>
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const terms = form.querySelector<BkCheckbox>('bk-checkbox')!;
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
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const group = form.querySelector<BkRadioGroup>('bk-radio-group')!;
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
        <bk-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const select = form.querySelector<BkNativeSelect>('bk-native-select')!;
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
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
        <bk-checkbox name="terms" checked>${labelAtom('Terms')}</bk-checkbox>
        <bk-radio-group name="size">
          <bk-field-label>Size</bk-field-label>
          <bk-radio-group-item value="m" checked>
            <bk-field-label slot="label">Medium</bk-field-label>
          </bk-radio-group-item>
        </bk-radio-group>
        <bk-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const email = form.querySelector<BkInput>('bk-input')!;
    const terms = form.querySelector<BkCheckbox>('bk-checkbox')!;
    const group = form.querySelector<BkRadioGroup>('bk-radio-group')!;
    const select = form.querySelector<BkNativeSelect>('bk-native-select')!;
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
    ).to.equal(await colorOf('var(--bk-text-danger)'));

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
    ).to.equal(await colorOf('var(--bk-text-default)'));
  });
});
