import { expect, fixture, html } from '@open-wc/testing';
import './define.js';
import type { BkCheckbox } from './bk-checkbox.js';
import { loadTheme, setTheme } from '../../test/helpers/theme.js';

const innerInput = (el: BkCheckbox) => el.shadowRoot!.querySelector('input')!;

const formData = (form: HTMLFormElement) => new FormData(form);

describe('bk-checkbox form participation', () => {
  before(loadTheme);

  afterEach(() => {
    setTheme('light');
  });

  it('should submit the platform default while checked and nothing while unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept"></bk-checkbox>
        <bk-checkbox name="other" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(formData(form).get('accept')).to.equal(null);
    expect(formData(form).get('other')).to.equal('on');

    el.checked = true;
    await el.updateComplete;

    expect(formData(form).get('accept')).to.equal('on');
  });

  it('should submit the value property instead of the default', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="terms" value="v2" checked></bk-checkbox>
      </form>
    `);

    expect(formData(form).get('terms')).to.equal('v2');
  });

  it('should submit nothing while it is mixed, whatever checked says', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="all" value="v2" checked indeterminate></bk-checkbox>
        <bk-checkbox name="plain" checked indeterminate></bk-checkbox>
      </form>
    `);
    const all = form.querySelector<BkCheckbox>('bk-checkbox')!;
    const plain = form.querySelector<BkCheckbox>('[name="plain"]')!;

    expect(formData(form).get('all'), 'the mixed box is a header, not a value').to.equal(null);
    expect(formData(form).get('plain')).to.equal(null);

    all.indeterminate = false;
    plain.indeterminate = false;
    await all.updateComplete;
    await plain.updateComplete;

    expect(formData(form).get('all'), 'the value comes back once it is only checked').to.equal(
      'v2',
    );
    expect(formData(form).get('plain')).to.equal('on');
  });

  it('should keep a required mixed box valueMissing and block the submit', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="all" required indeterminate></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;
    let submitted = false;
    let invalidOn: EventTarget | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = true;
    });
    form.addEventListener('invalid', (event) => (invalidOn = event.target), true);

    expect(el.validity.valueMissing, 'nothing is submitted, so the box is missing').to.equal(true);
    expect(el.validity.valid).to.equal(false);
    expect(form.checkValidity()).to.equal(false);
    expect(formData(form).get('all')).to.equal(null);

    form.requestSubmit();
    await el.updateComplete;

    expect(submitted).to.equal(false);
    expect(invalidOn).to.equal(el);

    el.indeterminate = false;
    el.checked = true;
    await el.updateComplete;

    expect(el.validity.valueMissing).to.equal(false);
    expect(form.checkValidity()).to.equal(true);
  });

  it('should restore the authored indeterminate and checked attributes on reset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="all" indeterminate></bk-checkbox>
        <bk-checkbox name="terms" checked></bk-checkbox>
      </form>
    `);
    const all = form.querySelector<BkCheckbox>('[name="all"]')!;
    const terms = form.querySelector<BkCheckbox>('[name="terms"]')!;

    innerInput(all).click();
    innerInput(terms).click();
    await all.updateComplete;
    await terms.updateComplete;

    expect(all.checked).to.equal(true);
    expect(all.indeterminate).to.equal(false);
    expect(terms.checked).to.equal(false);

    form.reset();
    await all.updateComplete;
    await terms.updateComplete;

    expect(all.indeterminate, 'the mixed state the markup declared comes back').to.equal(true);
    expect(innerInput(all).indeterminate).to.equal(true);
    expect(all.checked).to.equal(false);
    expect(innerInput(all).checked).to.equal(false);
    expect(terms.checked).to.equal(true);
    expect(innerInput(terms).checked).to.equal(true);
  });

  it('should expose the form and refuse to validate while required and unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" required></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(el.form).to.equal(form);
    expect(form.checkValidity()).to.equal(false);
    expect(el.validity.valueMissing).to.equal(true);

    el.checked = true;
    await el.updateComplete;

    expect(form.checkValidity()).to.equal(true);
  });

  it('should block submission while the error is set', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(el.validity.customError).to.equal(true);
    expect(form.checkValidity()).to.equal(false);
  });

  it('should restore the authored checked attribute on reset and clear the error', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" checked></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    innerInput(el).click();
    el.error = 'You have to accept the terms.';
    await el.updateComplete;

    expect(el.checked).to.equal(false);
    expect(el.error).to.equal('You have to accept the terms.');

    form.reset();
    await el.updateComplete;

    expect(el.checked).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
    expect(el.error).to.equal('');
  });

  it('should come back with no error and no state after a reset of an unchecked field', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" label="Accept terms"></bk-checkbox>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(true);

    form.reset();
    await el.updateComplete;

    expect(el.checked).to.equal(false);
    expect(innerInput(el).checked).to.equal(false);
  });

  it('should submit nothing and report valid while it is disabled', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <bk-checkbox name="accept" checked disabled></bk-checkbox>
        <bk-checkbox name="terms" required disabled></bk-checkbox>
      </form>
    `);

    expect(new FormData(form).get('accept')).to.equal(null);
    expect(form.checkValidity()).to.equal(true);
  });

  it('should be disabled and still focusable inside a disabled fieldset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <bk-checkbox name="accept"></bk-checkbox>
        </fieldset>
      </form>
    `);
    const el = form.querySelector<BkCheckbox>('bk-checkbox')!;

    expect(el.fieldDisabled).to.equal(true);
    expect(innerInput(el).getAttribute('aria-disabled')).to.equal('true');

    innerInput(el).click();
    await el.updateComplete;

    expect(el.checked).to.equal(false);

    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(innerInput(el));
  });
});
