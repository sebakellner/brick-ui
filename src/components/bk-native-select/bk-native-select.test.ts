import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import '../bk-field/define.js';
import type { BkNativeSelect } from './bk-native-select.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerSelect = (el: BkNativeSelect) => el.shadowRoot!.querySelector('select')!;
const innerLabel = (el: BkNativeSelect) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
const innerError = (el: BkNativeSelect) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;

const builtOptions = (el: BkNativeSelect) => Array.from(innerSelect(el).querySelectorAll('option'));

const optionFace = (el: BkNativeSelect) =>
  builtOptions(el).map((option) => [option.value, option.textContent]);

const colorOf = async (value: string): Promise<string> => {
  const probe = await fixture<HTMLElement>(html`<span style="color: ${value}"></span>`);

  return getComputedStyle(probe).color;
};

/* The mirror is rebuilt from a MutationObserver, and the rebuild is a render. */
const settle = async (el: BkNativeSelect) => {
  for (let round = 0; round < 2; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
  }
};

const atom = (value: string, label: string) => {
  const element = document.createElement('bk-native-select-opt');
  element.setAttribute('value', value);
  element.textContent = label;

  return element;
};

const labelAtom = html`<bk-field-label slot="label">Channel</bk-field-label>`;

const choose = async (el: BkNativeSelect, value: string) => {
  const select = innerSelect(el);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await settle(el);
};

describe('bk-native-select', () => {
  before(loadTheme);

  afterEach(() => {
    setTheme('light');
  });

  it('should mirror every atom as an option carrying its value and its text', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
        <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);

    expect(optionFace(el)).to.deep.equal([
      ['email', 'Email'],
      ['sms', 'SMS'],
    ]);
  });

  it('should mirror a group as an optgroup with its label, and render no group inside a group', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel">
        <bk-native-select-opt-group label="Direct">
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select-opt-group>
        <bk-native-select-opt-group label="Outer">
          <bk-native-select-opt-group label="Inner">
            <bk-native-select-opt value="mail">Mail</bk-native-select-opt>
          </bk-native-select-opt-group>
        </bk-native-select-opt-group>
      </bk-native-select>
    `);
    await settle(el);
    const groups = Array.from(innerSelect(el).querySelectorAll('optgroup'));

    expect(groups.map((group) => group.label)).to.deep.equal(['Direct', 'Outer']);
    expect(
      Array.from(groups[0].querySelectorAll('option')).map((option) => option.value),
      'the group holds its own options',
    ).to.deep.equal(['email', 'sms']);
    expect(
      groups[1].querySelectorAll('option').length,
      'the platform has no group inside a group, so neither does the mirror',
    ).to.equal(0);
    expect(
      innerSelect(el).querySelectorAll('optgroup optgroup').length,
      'no optgroup is nested in another',
    ).to.equal(0);
  });

  it('should rebuild the mirror when a child is added, removed or edited, without moving it', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);
    const first = el.querySelector('bk-native-select-opt')!;

    expect(optionFace(el)).to.deep.equal([['email', 'Email']]);

    el.append(atom('sms', 'SMS'));
    await settle(el);

    expect(optionFace(el), 'an added atom is an added option').to.deep.equal([
      ['email', 'Email'],
      ['sms', 'SMS'],
    ]);

    first.setAttribute('value', 'mail');
    first.textContent = 'Mail';
    first.disabled = true;
    await settle(el);
    const [changed] = builtOptions(el);

    expect(changed.value, 'an edited value is mirrored').to.equal('mail');
    expect(changed.textContent, 'edited text is mirrored').to.equal('Mail');
    expect(changed.disabled, 'a disabled atom is a disabled option').to.equal(true);

    el.lastElementChild!.remove();
    await settle(el);

    expect(optionFace(el), 'a removed atom removes its option').to.deep.equal([['mail', 'Mail']]);

    expect(first.parentElement === el, 'the consumer node is never re-parented').to.equal(true);
    expect(first.isConnected, 'and never removed').to.equal(true);
    expect(first.slot, 'and given no slot, because the mirror is not projection').to.equal('');
  });

  it('should keep a value set before the options exist, and select it once they arrive', async () => {
    const el = await fixture<BkNativeSelect>(
      html`<bk-native-select name="channel" value="sms"></bk-native-select>`,
    );
    await settle(el);

    expect(el.value, 'nothing to select yet, so the property keeps what was set').to.equal('sms');
    expect(innerSelect(el).value).to.equal('');

    el.append(atom('email', 'Email'), atom('sms', 'SMS'));
    await settle(el);

    expect(innerSelect(el).value, 'the option arrived and the value selects it').to.equal('sms');
    expect(innerSelect(el).selectedOptions[0]?.textContent).to.equal('SMS');
  });

  it('should select the matching option and report the choice back as bk-change', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel" value="sms">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
        <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);
    let received: CustomEvent<{ value: string }> | undefined;
    el.addEventListener('bk-change', (event) => {
      received = event as CustomEvent<{ value: string }>;
    });

    expect(innerSelect(el).value, 'the property selects the option').to.equal('sms');
    expect(innerSelect(el).selectedOptions[0]?.textContent).to.equal('SMS');

    await choose(el, 'email');

    expect(el.value, 'the choice is the property now').to.equal('email');
    expect(received?.detail).to.deep.equal({ value: 'email' });
    expect(received?.bubbles).to.equal(true);
    expect(received?.composed).to.equal(true);
  });

  it('should submit the selected value under its name, and nothing while the placeholder is selected', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel" placeholder="Choose a channel">
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const el = form.querySelector('bk-native-select')!;
    await settle(el);

    expect(new FormData(form).get('channel'), 'the placeholder is no answer').to.equal(null);
    expect(new FormData(form).getAll('channel').length, 'not even an empty entry').to.equal(0);

    await choose(el, 'sms');

    expect(new FormData(form).get('channel')).to.equal('sms');
  });

  it('should render the placeholder as a hidden, disabled first option', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel" placeholder="Choose a channel">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);
    const [placeholder] = builtOptions(el);

    expect(placeholder.value).to.equal('');
    expect(placeholder.textContent).to.equal('Choose a channel');
    expect(placeholder.disabled, 'the placeholder cannot be picked from the list').to.equal(true);
    expect(placeholder.hidden, 'and is not in the list at all').to.equal(true);
    expect(innerSelect(el).selectedIndex, 'it is what "nothing selected" shows').to.equal(0);
    expect(el.value, 'and the value of that state is empty').to.equal('');
  });

  it('should behave like a native select with no placeholder, where the first option is the choice', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel">
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const el = form.querySelector('bk-native-select')!;
    await settle(el);

    expect(innerSelect(el).selectedIndex, 'the platform selects the first option').to.equal(0);
    expect(el.value, 'and the property reports what is selected').to.equal('email');
    expect(new FormData(form).get('channel')).to.equal('email');
  });

  it('should report valueMissing while the placeholder is selected, and block the submit', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel" placeholder="Choose a channel" required>
          ${labelAtom}
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const el = form.querySelector('bk-native-select')!;
    await settle(el);
    let submitted = false;
    let invalidOn: EventTarget | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });
    form.addEventListener('invalid', (event) => (invalidOn = event.target), true);

    expect(innerSelect(el).value, 'nothing is chosen').to.equal('');
    expect(el.validity.valueMissing, 'an empty placeholder is a missing answer').to.equal(true);
    expect(form.checkValidity()).to.equal(false);

    form.requestSubmit();
    await settle(el);

    expect(submitted, 'the submit never runs').to.equal(false);
    expect(invalidOn === el, 'the select is what the submit rejected').to.equal(true);

    await choose(el, 'email');

    expect(el.validity.valueMissing, 'a real choice is the answer').to.equal(false);
    expect(form.checkValidity()).to.equal(true);
  });

  it('should disable the inner select with the native attribute, and let a disabled fieldset reach it', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel" value="email" disabled>
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
        </bk-native-select>
        <fieldset disabled>
          <bk-native-select name="other" required>
            <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
          </bk-native-select>
        </fieldset>
      </form>
    `);
    const [el, inherited] = form.querySelectorAll('bk-native-select');
    await settle(el);
    await settle(inherited);
    const select = innerSelect(el);

    expect(select.disabled, 'the native attribute, not a hint').to.equal(true);
    expect(select.hasAttribute('disabled')).to.equal(true);
    expect(select.getAttribute('aria-disabled'), 'a select is text-field-shaped').to.equal(null);
    expect(new FormData(form).get('channel'), 'a disabled select submits nothing').to.equal(null);

    expect(inherited.fieldDisabled, 'a disabled fieldset reaches the control').to.equal(true);
    expect(innerSelect(inherited).disabled).to.equal(true);
    expect(inherited.validity.valueMissing, 'a disabled field reports no error').to.equal(false);
  });

  it('should paint the label and show the error region when the field has an error', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel" error="Pick a channel">
        ${labelAtom}
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);
    const error = innerError(el);

    expect(error.textContent!.trim(), 'the region carries the message').to.equal('Pick a channel');
    expect(getComputedStyle(innerLabel(el)).color, 'the label paints the danger role').to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
    expect(innerSelect(el).getAttribute('aria-invalid')).to.equal('true');
    expect(
      innerSelect(el).getAttribute('aria-describedby'),
      'the field points at the region',
    ).to.equal(error.id);
  });

  it('should restore the first option on reset when there is no placeholder', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-native-select name="channel">
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
          <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const el = form.querySelector('bk-native-select') as BkNativeSelect;
    await el.updateComplete;
    el.value = 'sms';
    await el.updateComplete;

    form.reset();
    await el.updateComplete;

    expect(el.value, 'the value is the option the browser restores').to.equal('email');
    expect(
      el.shadowRoot!.querySelector('select')!.selectedIndex,
      'and the control is not left blank',
    ).to.equal(0);
  });

  it('should leave the native caret more air than the text on the end side', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel" placeholder="Choose a channel">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    await el.updateComplete;
    const select = el.shadowRoot!.querySelector('select')!;
    const style = getComputedStyle(select);

    expect(
      parseFloat(style.paddingInlineEnd),
      'the caret sits inside the end padding, so that side is wider',
    ).to.be.greaterThan(parseFloat(style.paddingInlineStart));
  });
});
