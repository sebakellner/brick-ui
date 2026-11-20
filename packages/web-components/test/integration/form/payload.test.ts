/* What a form assembled by an application actually sends. Each case composes several
 * widgets in one native <form>, because the payload is the one thing no single
 * component's suite can state: an entry that is absent is absent in the assembly, and a
 * group that submitted once per radio would still pass every unit suite.
 *
 * The entry is read as a string or `null`, never as the raw FormDataEntryValue: a
 * comparison that can only pass or hang is not an assertion (T6). */

import { expect, fixture, html } from '@open-wc/testing';
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
import { settle } from '@brikka-ui/test-utils/settle.js';

const innerInput = (el: BrikkaInput) => el.shadowRoot!.querySelector('input')!;
const innerBox = (el: BrikkaCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BrikkaNativeSelect) => el.shadowRoot!.querySelector('select')!;
const radios = (el: BrikkaRadioGroup) =>
  Array.from(el.querySelectorAll<BrikkaRadioGroupItem>('brikka-radio-group-item'));

/* The group writes `checked` on its items, so each item commits its own update. */
const settleGroup = async (el: BrikkaRadioGroup) => {
  await settle(el);
  for (const radio of radios(el)) await settle(radio);
};

const submitted = (form: HTMLFormElement, name: string): string | null => {
  const value = new FormData(form).get(name);

  return value === null ? null : String(value);
};

const submittedAll = (form: HTMLFormElement, name: string): string[] =>
  new FormData(form).getAll(name).map((value) => String(value));

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

describe('form payload', () => {
  it('should submit the value typed into the input under its name', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-input name="email" value="old@brikka.dev">${labelAtom('Email')}</brikka-input>
        <brikka-checkbox name="terms" value="accepted" checked
          >${labelAtom('Terms')}</brikka-checkbox
        >
      </form>
    `);
    const field = form.querySelector<BrikkaInput>('brikka-input')!;
    await settle(field);

    expect(Boolean(innerInput(field)), 'the input rendered its native control').to.equal(true);
    expect(submitted(form, 'email'), 'the value attribute is the mounted entry').to.equal(
      'old@brikka.dev',
    );

    await type(field, 'you@brikka.dev');

    expect(submitted(form, 'email'), 'the typed value is what the form sends').to.equal(
      'you@brikka.dev',
    );
    expect(submitted(form, 'terms'), 'and the box beside it still carries its own value').to.equal(
      'accepted',
    );
  });

  it('should submit a checked checkbox and no entry for the unchecked one', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-checkbox name="terms" value="accepted" checked
          >${labelAtom('Terms')}</brikka-checkbox
        >
        <brikka-checkbox name="newsletter" value="weekly"
          >${labelAtom('Newsletter')}</brikka-checkbox
        >
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
      </form>
    `);
    const [checked, unchecked] = Array.from(
      form.querySelectorAll<BrikkaCheckbox>('brikka-checkbox'),
    );

    expect(innerBox(checked).checked, 'the authored box rendered checked').to.equal(true);
    expect(Boolean(innerBox(unchecked)), 'the optional box rendered too').to.equal(true);

    expect(submitted(form, 'terms'), 'a checked box sends its own value').to.equal('accepted');
    expect(
      new FormData(form).has('newsletter'),
      'an unchecked box sends no entry under its name',
    ).to.equal(false);
  });

  it('should submit a radio group’s selection once, not once per radio', async () => {
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

    expect(radios(group).length, 'three boxes rendered, one selection among them').to.equal(3);
    expect(submittedAll(form, 'size'), 'the set is one entry, not one per radio').to.deep.equal([
      'm',
    ]);
    expect(submitted(form, 'email'), 'the field beside the group still sends its own').to.equal(
      'you@brikka.dev',
    );
  });

  it('should submit the chosen option and nothing while the placeholder shows', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <brikka-native-select-opt value="email">Email</brikka-native-select-opt>
          <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
        </brikka-native-select>
        <brikka-input name="email-address" value="you@brikka.dev"
          >${labelAtom('Email')}</brikka-input
        >
      </form>
    `);
    const select = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(select);

    expect(
      innerSelect(select).querySelectorAll('option').length,
      'the placeholder and two options were mirrored',
    ).to.equal(3);
    expect(new FormData(form).has('channel'), 'the placeholder is a face, not an answer').to.equal(
      false,
    );

    await choose(select, 'sms');

    expect(submitted(form, 'channel'), 'the chosen option is the entry').to.equal('sms');
  });

  it('should submit nothing from a disabled control', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <brikka-input name="draft" value="not sent" disabled>${labelAtom('Draft')}</brikka-input>
        <brikka-checkbox name="terms" value="accepted" checked disabled
          >${labelAtom('Terms')}</brikka-checkbox
        >
        <brikka-input name="email" value="you@brikka.dev">${labelAtom('Email')}</brikka-input>
      </form>
    `);
    const draft = form.querySelector<BrikkaInput>('brikka-input')!;
    const terms = form.querySelector<BrikkaCheckbox>('brikka-checkbox')!;
    await settle(draft);
    await settle(terms);

    expect(innerInput(draft).disabled, 'the disabled field rendered disabled').to.equal(true);
    expect(innerBox(terms).checked, 'the disabled box is still checked').to.equal(true);

    expect(new FormData(form).has('draft'), 'a disabled field has no entry').to.equal(false);
    expect(new FormData(form).has('terms'), 'and neither has a disabled box').to.equal(false);
    expect(submitted(form, 'email'), 'while its enabled sibling still sends its value').to.equal(
      'you@brikka.dev',
    );
  });
});
