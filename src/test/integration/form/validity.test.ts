/* The form's own verdict over an assembly: which widget refuses the submit, in what
 * order, and how many times the submit finally arrives. No component can state this —
 * an input reporting `valueMissing` says nothing about whether the select beside it is
 * asked next — and the count is the half a boolean flag cannot say. */

import { expect, fixture, html } from '@open-wc/testing';
import '../../../components/bk-input/define.js';
import '../../../components/bk-checkbox/define.js';
import '../../../components/bk-native-select/define.js';
import '../../../components/bk-field/define.js';
import type { BkInput } from '../../../components/bk-input/bk-input.js';
import type { BkNativeSelect } from '../../../components/bk-native-select/bk-native-select.js';
import { labelAtom } from '../../helpers/atoms.js';
import { watchSubmit } from '../../helpers/form.js';
import { settle } from '../../helpers/settle.js';

const innerInput = (el: BkInput) => el.shadowRoot!.querySelector('input')!;
const innerSelect = (el: BkNativeSelect) => el.shadowRoot!.querySelector('select')!;

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

/* `watchSubmit` remembers the last control the platform reported, which is not the
 * question a submit asks: the browser reports every invalid control, in document order,
 * and the first of them is the one it moves the user to. The order needs its own
 * capture; the count stays the helper's. */
const invalidOrder = (form: HTMLFormElement): EventTarget[] => {
  const reported: EventTarget[] = [];

  form.addEventListener(
    'invalid',
    (event) => {
      if (event.target) reported.push(event.target);
    },
    true,
  );

  return reported;
};

const twoRequired = html`
  <form>
    <bk-input name="email" required>${labelAtom('Email')}</bk-input>
    <bk-native-select name="channel" placeholder="Choose a channel" required>
      ${labelAtom('Channel')}
      <bk-native-select-opt value="email">Email</bk-native-select-opt>
      <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
    </bk-native-select>
    <bk-checkbox name="terms">${labelAtom('Terms')}</bk-checkbox>
  </form>
`;

describe('form validity', () => {
  it('should refuse the submit while both required widgets are empty and report the first in document order', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BkInput>('bk-input')!;
    const channel = form.querySelector<BkNativeSelect>('bk-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);
    const reported = invalidOrder(form);

    expect(Boolean(innerInput(email)), 'the required field rendered').to.equal(true);
    expect(Boolean(innerSelect(channel)), 'the required select rendered').to.equal(true);

    expect(email.validity.valueMissing, 'the empty required field is missing a value').to.equal(
      true,
    );
    expect(channel.validity.valueMissing, 'and so is the empty required select').to.equal(true);
    expect(form.checkValidity(), 'so the form reports itself invalid').to.equal(false);

    reported.length = 0;
    form.requestSubmit();
    await settle(email);

    expect(watch.count, 'the submit never reached the form').to.equal(0);
    expect(reported.length, 'both empty required widgets were reported').to.equal(2);
    expect(
      reported[0] === email,
      'the first widget in document order is the one reported first',
    ).to.equal(true);
    expect(reported[1] === channel, 'and the select is reported after it, never before').to.equal(
      true,
    );
  });

  it('should stay invalid on the second widget once the first is satisfied', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BkInput>('bk-input')!;
    const channel = form.querySelector<BkNativeSelect>('bk-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);

    await type(email, 'you@brick.dev');

    expect(email.validity.valueMissing, 'the typed field is no longer missing').to.equal(false);
    expect(channel.validity.valueMissing, 'the select still is').to.equal(true);
    expect(form.checkValidity(), 'so the form is still invalid').to.equal(false);

    form.requestSubmit();
    await settle(channel);

    expect(watch.count, 'the submit is still refused').to.equal(0);
    expect(
      watch.invalidOn === channel,
      'and the invalid event has moved on to the second widget',
    ).to.equal(true);
  });

  it('should run the submit once when both required widgets are satisfied', async () => {
    const form = await fixture<HTMLFormElement>(twoRequired);
    const email = form.querySelector<BkInput>('bk-input')!;
    const channel = form.querySelector<BkNativeSelect>('bk-native-select')!;
    await settle(email);
    await settle(channel);
    const watch = watchSubmit(form);

    await type(email, 'you@brick.dev');
    await choose(channel, 'sms');

    expect(form.checkValidity(), 'the form has no refusal left').to.equal(true);
    expect(submitted(form, 'email'), 'the typed value is part of the payload').to.equal(
      'you@brick.dev',
    );
    expect(submitted(form, 'channel'), 'and so is the chosen option').to.equal('sms');

    form.requestSubmit();
    await settle(email);

    expect(watch.count, 'the submit arrived, and arrived once').to.equal(1);
  });
});
