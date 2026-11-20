/* The form's own verdict over an assembly: which widget refuses the submit, in what
 * order, and how many times the submit finally arrives. No component can state this —
 * an input reporting `valueMissing` says nothing about whether the select beside it is
 * asked next — and the count is the half a boolean flag cannot say. */

import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/brikka-input/define.js';
import '../../../src/components/brikka-checkbox/define.js';
import '../../../src/components/brikka-native-select/define.js';
import '../../../src/components/brikka-field/define.js';
import type { BrikkaInput } from '../../../src/components/brikka-input/brikka-input.js';
import type { BrikkaNativeSelect } from '../../../src/components/brikka-native-select/brikka-native-select.js';
import { labelAtom } from '@brikka-ui/test-utils/atoms.js';
import { watchSubmit } from '@brikka-ui/test-utils/form.js';
import { settle } from '@brikka-ui/test-utils/settle.js';

const innerInput = (el: BrikkaInput) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BrikkaNativeSelect) => el.shadowRoot!.querySelector('select')!;

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

const twoRequired = html`
  <form>
    <brikka-input name="email" required>${labelAtom('Email')}</brikka-input>
    <brikka-native-select name="channel" placeholder="Choose a channel" required>
      ${labelAtom('Channel')}
      <brikka-native-select-opt value="email">Email</brikka-native-select-opt>
      <brikka-native-select-opt value="sms">SMS</brikka-native-select-opt>
    </brikka-native-select>
    <brikka-checkbox name="terms">${labelAtom('Terms')}</brikka-checkbox>
  </form>
`;

describe('form validity', () => {
  it('should refuse the submit while both required widgets are empty and report the first in document order', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BrikkaInput>('brikka-input')!;
    const channel = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);

    expect(Boolean(innerInput(email)), 'the required field rendered').to.equal(true);
    expect(Boolean(innerSelect(channel)), 'the required select rendered').to.equal(true);

    expect(email.validity.valueMissing, 'the empty required field is missing a value').to.equal(
      true,
    );
    expect(channel.validity.valueMissing, 'and so is the empty required select').to.equal(true);
    expect(form.checkValidity(), 'so the form reports itself invalid').to.equal(false);

    watch.invalidOrder.length = 0;
    form.requestSubmit();
    await settle(email);

    expect(watch.count, 'the submit never reached the form').to.equal(0);
    expect(watch.invalidOrder.length, 'both empty required widgets were reported').to.equal(2);
    expect(
      watch.invalidOrder[0] === email,
      'the first widget in document order is the one reported first',
    ).to.equal(true);
    expect(
      watch.invalidOrder[1] === channel,
      'and the select is reported after it, never before',
    ).to.equal(true);
  });

  it('should stay invalid on the second widget once the first is satisfied', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BrikkaInput>('brikka-input')!;
    const channel = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);

    await type(email, 'you@brikka.dev');

    expect(email.validity.valueMissing, 'the typed field is no longer missing').to.equal(false);
    expect(channel.validity.valueMissing, 'the select still is').to.equal(true);
    expect(form.checkValidity(), 'so the form is still invalid').to.equal(false);

    watch.invalidOrder.length = 0;
    form.requestSubmit();
    await settle(channel);

    expect(watch.count, 'the submit is still refused').to.equal(0);
    expect(
      watch.invalidOrder[0] === channel,
      'and the invalid event has moved on to the second widget',
    ).to.equal(true);
  });

  it('should run the submit once when both required widgets are satisfied', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BrikkaInput>('brikka-input')!;
    const channel = form.querySelector<BrikkaNativeSelect>('brikka-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);

    await type(email, 'you@brikka.dev');
    await choose(channel, 'sms');

    expect(form.checkValidity(), 'the form has no refusal left').to.equal(true);
    expect(submitted(form, 'email'), 'the typed value is part of the payload').to.equal(
      'you@brikka.dev',
    );
    expect(submitted(form, 'channel'), 'and so is the chosen option').to.equal('sms');

    form.requestSubmit();
    await settle(email);

    expect(watch.count, 'the submit arrived, and arrived once').to.equal(1);
  });
});
