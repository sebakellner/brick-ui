import { settle } from '../../../test/helpers/settle.js';
import { colorOf } from '../../../test/helpers/style.js';
import { labelAtom } from '../../../test/helpers/atoms.js';
import { watchSubmit } from '../../../test/helpers/form.js';
import { contrastRatio } from '../../../test/helpers/contrast.js';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '.././define.js';
import '../../bk-field/define.js';
import type { BkNativeSelect } from '.././bk-native-select.js';
import { expectNoViolations, expectRendered } from '../../../test/helpers/a11y.js';
import { setTheme } from '../../../test/helpers/theme.js';

const innerSelect = (el: BkNativeSelect) => el.shadowRoot!.querySelector('select')!;
const innerLabel = (el: BkNativeSelect) =>
  el.shadowRoot!.querySelector<HTMLLabelElement>('[part="label"]')!;
const innerError = (el: BkNativeSelect) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
const innerDescription = (el: BkNativeSelect) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;

const descriptionNode = (text: string) => {
  const node = document.createElement('bk-field-description');
  node.setAttribute('slot', 'description');
  node.textContent = text;

  return node;
};

const builtOptions = (el: BkNativeSelect) => Array.from(innerSelect(el).querySelectorAll('option'));

const optionFace = (el: BkNativeSelect) =>
  builtOptions(el).map((option) => [option.value, option.textContent]);

/* The mirror is rebuilt from a MutationObserver, and the rebuild is a render. */

const atom = (value: string, label: string) => {
  const element = document.createElement('bk-native-select-opt');
  element.setAttribute('value', value);
  element.textContent = label;

  return element;
};

const choose = async (el: BkNativeSelect, value: string) => {
  const select = innerSelect(el);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await settle(el);
};

describe('bk-native-select', () => {
  describe('accessibility', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should have no accessibility violations (${theme})`, async () => {
        setTheme(theme);
        const el = await fixture<BkNativeSelect>(html`
          <bk-native-select
            >${labelAtom('Channel')}
            <bk-native-select-opt value="email">Email</bk-native-select-opt>
            <bk-native-select-opt value="sms">SMS</bk-native-select-opt>
          </bk-native-select>
        `);

        await expectRendered(el, 'select');
        await expectNoViolations(el);
      });
    }
  });
  afterEach(() => {
    setTheme('light');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should keep the field border at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BkNativeSelect>(html`
        <bk-native-select>${labelAtom('Channel')}</bk-native-select>
      `);
      const style = getComputedStyle(innerSelect(el));

      expect(contrastRatio(style.borderTopColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the caret at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const el = await fixture<BkNativeSelect>(html`
        <bk-native-select>${labelAtom('Channel')}</bk-native-select>
      `);
      const caret = getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>('[part="caret"]')!);
      const style = getComputedStyle(innerSelect(el));

      expect(contrastRatio(caret.borderInlineEndColor, style.backgroundColor)).to.be.at.least(3);
    });

    it(`should keep the focus ring at 3:1 against its own surface (${theme})`, async () => {
      setTheme(theme);
      const host = await fixture<HTMLElement>(html`
        <div>
          <button type="button">before</button>
          <bk-native-select>${labelAtom('Channel')}</bk-native-select>
        </div>
      `);
      const el = host.querySelector<BkNativeSelect>('bk-native-select')!;
      host.querySelector<HTMLElement>('button')!.focus();
      await sendKeys({ press: 'Tab' });
      await nextFrame();
      const style = getComputedStyle(innerSelect(el));

      expect(style.outlineStyle, 'the ring is drawn').to.equal('solid');
      expect(style.outlineWidth, 'the ring has a width').to.not.equal('0px');
      expect(contrastRatio(style.outlineColor, style.backgroundColor)).to.be.at.least(3);
    });
  }

  it('should point its label at the select it names', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select>${labelAtom('Channel')}</bk-native-select>
    `);

    expect(innerLabel(el).htmlFor).to.equal(innerSelect(el).id);
    expect(innerSelect(el).id).to.not.equal('');
  });

  it('should delegate focus to the real select', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select>${labelAtom('Channel')}</bk-native-select>
    `);

    el.focus();

    expect(
      el.shadowRoot!.activeElement === innerSelect(el),
      'focus lands on the real select',
    ).to.equal(true);
  });

  it('should reference no description while the region is empty', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select>${labelAtom('Channel')}</bk-native-select>
    `);
    await settle(el);

    expect(innerDescription(el).textContent!.trim(), 'the region describes nothing').to.equal('');
    expect(
      innerSelect(el).getAttribute('aria-describedby'),
      'a region with no content is not referenced',
    ).to.equal(null);
  });

  it('should describe the select while the atom has text, and drop the reference when it empties', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select>${labelAtom('Channel')}</bk-native-select>
    `);
    const description = descriptionNode('We only use it for the receipt.');
    el.appendChild(description);
    await settle(el);

    expect(innerSelect(el).getAttribute('aria-describedby')).to.equal(innerDescription(el).id);

    description.textContent = '';
    await settle(el);

    expect(
      innerSelect(el).getAttribute('aria-describedby'),
      'an emptied region is no longer referenced',
    ).to.equal(null);
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

  it('should lose an element written inside an option atom', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel">
        ${labelAtom('Channel')}
        <bk-native-select-opt value="email"
          >Email <span class="chip">primary</span></bk-native-select-opt
        >
      </bk-native-select>
    `);
    await settle(el);
    const [option] = builtOptions(el);

    expect(option.textContent, 'the atom text is the label, flattened').to.equal('Email primary');
    expect(option.childElementCount, 'the element inside the atom is lost').to.equal(0);
    expect(Boolean(option.querySelector('span')), 'nothing of it is rendered').to.equal(false);
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
          ${labelAtom('Channel')}
          <bk-native-select-opt value="email">Email</bk-native-select-opt>
        </bk-native-select>
      </form>
    `);
    const el = form.querySelector('bk-native-select')!;
    await settle(el);
    const watch = watchSubmit(form);

    expect(innerSelect(el).value, 'nothing is chosen').to.equal('');
    expect(el.validity.valueMissing, 'an empty placeholder is a missing answer').to.equal(true);
    expect(form.checkValidity()).to.equal(false);

    form.requestSubmit();
    await settle(el);

    expect(watch.count, 'the submit never runs').to.equal(0);
    expect(watch.invalidOrder[0] === el, 'the select is what the submit rejected').to.equal(true);

    await choose(el, 'email');

    expect(el.validity.valueMissing, 'a real choice is the answer').to.equal(false);
    expect(form.checkValidity()).to.equal(true);
  });

  it('should put the native required attribute on the inner select', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select required>
        ${labelAtom('Channel')}
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    await settle(el);

    expect(innerSelect(el).hasAttribute('required')).to.equal(true);
    expect(innerSelect(el).required, 'the platform is what refuses the empty answer').to.equal(
      true,
    );
  });

  it('should mark its label with a star while required', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select required>${labelAtom('Channel')}</bk-native-select>
    `);
    const mark = el.shadowRoot!.querySelector<HTMLElement>('[part="required"]');

    expect(Boolean(mark), 'a required select marks its label').to.equal(true);
    expect(mark!.textContent, 'the mark is a star').to.equal('*');
    expect(mark!.getAttribute('aria-hidden'), 'and decoration for the eye').to.equal('true');
    expect(getComputedStyle(mark!).color, 'painted with the danger role').to.equal(
      await colorOf('var(--bk-text-danger)'),
    );
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
        ${labelAtom('Channel')}
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

  it('should draw the caret away from the end edge, and let the click through', async () => {
    const el = await fixture<BkNativeSelect>(html`
      <bk-native-select name="channel" placeholder="Choose a channel">
        <bk-native-select-opt value="email">Email</bk-native-select-opt>
      </bk-native-select>
    `);
    el.style.setProperty('--bk-space-3', '12px');
    await el.updateComplete;
    const select = el.shadowRoot!.querySelector('select')!;
    const caret = el.shadowRoot!.querySelector<HTMLElement>('[part="caret"]')!;

    expect(getComputedStyle(select).appearance, 'the native arrow is off').to.equal('none');

    const gap = select.getBoundingClientRect().right - caret.getBoundingClientRect().right;
    expect(gap, 'the caret keeps a gap from the border').to.be.at.least(13);
    expect(
      caret.getBoundingClientRect().width,
      'and its visible box is the 8px step',
    ).to.be.closeTo(8, 0.2);

    const box = caret.getBoundingClientRect();
    const hit = el.shadowRoot!.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    expect(hit === select, 'the decoration does not steal the click').to.equal(true);
  });
});
