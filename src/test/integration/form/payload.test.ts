/* What a form assembled by an application actually sends. Each case composes several
 * widgets in one native <form>, because the payload is the one thing no single
 * component's suite can state: an entry that is absent is absent in the assembly, and a
 * group that submitted once per radio would still pass every unit suite.
 *
 * The entry is read as a string or `null`, never as the raw FormDataEntryValue: a
 * comparison that can only pass or hang is not an assertion (T6). */

import { expect, fixture, html } from '@open-wc/testing';
import '../../../components/bk-input/define.js';
import '../../../components/bk-checkbox/define.js';
import '../../../components/bk-radio-group/define.js';
import '../../../components/bk-native-select/define.js';
import '../../../components/bk-field/define.js';
import type { BkInput } from '../../../components/bk-input/bk-input.js';
import type { BkCheckbox } from '../../../components/bk-checkbox/bk-checkbox.js';
import type { BkRadioGroup } from '../../../components/bk-radio-group/bk-radio-group.js';
import type { BkRadioGroupItem } from '../../../components/bk-radio-group/bk-radio-group-item.js';
import type { BkNativeSelect } from '../../../components/bk-native-select/bk-native-select.js';
import { labelAtom } from '../../helpers/atoms.js';
import { settle } from '../../helpers/settle.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerBox = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BkNativeSelect) => el.shadowRoot!.querySelector('select')!;
const radios = (el: BkRadioGroup) =>
  Array.from(el.querySelectorAll<BkRadioGroupItem>('bk-radio-group-item'));

/* The group writes `checked` on its items, so each item commits its own update. */
const settleGroup = async (el: BkRadioGroup) => {
  await settle(el);
  for (const radio of radios(el)) await settle(radio);
};

const submitted = (form: HTMLFormElement, name: string): string | null => {
  const value = new FormData(form).get(name);

  return value === null ? null : String(value);
};

const submittedAll = (form: HTMLFormElement, name: string): string[] =>
  new FormData(form).getAll(name).map((value) => String(value));

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

describe('form payload', () => {
  it('should submit the value typed into the input under its name', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-input name="email" value="old@brick.dev">${labelAtom('Email')}</bk-input>
        <bk-checkbox name="terms" value="accepted" checked>${labelAtom('Terms')}</bk-checkbox>
      </form>
    `);
    const field = form.querySelector<BkInput>('bk-input')!;
    await settle(field);

    expect(Boolean(innerInput(field)), 'the input rendered its native control').to.equal(true);
    expect(submitted(form, 'email'), 'the value attribute is the mounted entry').to.equal(
      'old@brick.dev',
    );

    await type(field, 'you@brick.dev');

    expect(submitted(form, 'email'), 'the typed value is what the form sends').to.equal(
      'you@brick.dev',
    );
    expect(submitted(form, 'terms'), 'and the box beside it still carries its own value').to.equal(
      'accepted',
    );
  });

  it('should submit a checked checkbox and no entry for the unchecked one', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" value="accepted" checked>${labelAtom('Terms')}</bk-checkbox>
        <bk-checkbox name="newsletter" value="weekly">${labelAtom('Newsletter')}</bk-checkbox>
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const [checked, unchecked] = Array.from(form.querySelectorAll<BkCheckbox>('bk-checkbox'));

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

    expect(radios(group).length, 'three boxes rendered, one selection among them').to.equal(3);
    expect(submittedAll(form, 'size'), 'the set is one entry, not one per radio').to.deep.equal([
      'm',
    ]);
    expect(submitted(form, 'email'), 'the field beside the group still sends its own').to.equal(
      'you@brick.dev',
    );
  });

  it('should submit the chosen option and nothing while the placeholder shows', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel" placeholder="Choose a channel">
          ${labelAtom('Channel')}
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
        <bk-input name="email-address" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const select = form.querySelector<BkNativeSelect>('bk-native-select')!;
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
        <bk-input name="draft" value="not sent" disabled>${labelAtom('Draft')}</bk-input>
        <bk-checkbox name="terms" value="accepted" checked disabled
          >${labelAtom('Terms')}</bk-checkbox
        >
        <bk-input name="email" value="you@brick.dev">${labelAtom('Email')}</bk-input>
      </form>
    `);
    const draft = form.querySelector<BkInput>('bk-input')!;
    const terms = form.querySelector<BkCheckbox>('bk-checkbox')!;
    await settle(draft);
    await settle(terms);

    expect(innerInput(draft).disabled, 'the disabled field rendered disabled').to.equal(true);
    expect(innerBox(terms).checked, 'the disabled box is still checked').to.equal(true);

    expect(new FormData(form).has('draft'), 'a disabled field has no entry').to.equal(false);
    expect(new FormData(form).has('terms'), 'and neither has a disabled box').to.equal(false);
    expect(submitted(form, 'email'), 'while its enabled sibling still sends its value').to.equal(
      'you@brick.dev',
    );
  });
});
