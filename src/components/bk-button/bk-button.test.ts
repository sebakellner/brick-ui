import { expect, fixture, html } from '@open-wc/testing';
import './bk-button.js';
import type { BkButton } from './bk-button.js';
import { contrastRatio, contrastWithWhite } from '../../test/helpers/contrast.js';
import { loadTheme } from '../../test/helpers/theme.js';

const innerButton = (el: BkButton) => el.shadowRoot!.querySelector('button')!;

const mount = (variant?: string) =>
  fixture<BkButton>(
    variant
      ? html`<bk-button variant=${variant}>Save</bk-button>`
      : html`<bk-button>Save</bk-button>`,
  );

describe('bk-button', () => {
  before(loadTheme);

  // :root and body live outside the fixture wrapper, so fixtureCleanup leaves
  // them alone; the inherited-property tests have to clean up after themselves.
  afterEach(() => {
    for (const prop of [
      '--bk-button-bg',
      '--bk-button-primary-bg',
      '--bk-button-secondary-bg',
      '--bk-button-disabled-opacity',
      '--bk-font-weight-medium',
      'font-family',
    ]) {
      document.documentElement.style.removeProperty(prop);
      document.body.style.removeProperty(prop);
    }
  });

  it('should default to the primary variant, reflected on the host', async () => {
    const button = await mount();

    expect(button.variant).to.equal('primary');
    expect(button.getAttribute('variant')).to.equal('primary');
    expect(innerButton(button).getAttribute('part')).to.equal('button');
  });

  it('should mark a disabled button as unavailable without dropping it from the tab order', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));

    innerButton(button).click();

    expect(innerButton(button).getAttribute('aria-disabled')).to.equal('true');
    expect(innerButton(button).disabled).to.equal(false);
    expect(clicks).to.equal(0);

    button.focus();
    expect(button.shadowRoot!.activeElement).to.equal(innerButton(button));
  });

  it('should keep its label readable on the accent background', async () => {
    const primary = await mount();
    const style = getComputedStyle(innerButton(primary));

    expect(contrastRatio(style.color, style.backgroundColor)).to.be.at.least(4.5);
  });

  it('should keep the secondary border at 3:1 against a white surface', async () => {
    const secondary = await mount('secondary');
    const border = getComputedStyle(innerButton(secondary)).borderTopColor;

    expect(contrastWithWhite(border)).to.be.at.least(3);
  });

  it('should let a public custom property win over the variant default', async () => {
    const ghost = await mount('ghost');
    ghost.style.setProperty('--bk-button-bg', 'rgb(1, 2, 3)');

    expect(getComputedStyle(innerButton(ghost)).backgroundColor).to.equal('rgb(1, 2, 3)');
  });

  it('should let an inherited public property win over the variant default', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-button-bg', 'rgb(9, 9, 9)');

    expect(getComputedStyle(innerButton(primary)).backgroundColor).to.equal('rgb(9, 9, 9)');
    expect(getComputedStyle(innerButton(secondary)).backgroundColor).to.equal('rgb(9, 9, 9)');
  });

  it('should map the default variant and a named variant to their control tokens', async () => {
    const primary = await mount();
    const secondary = await mount('secondary');
    document.documentElement.style.setProperty('--bk-button-primary-bg', 'rgb(4, 5, 6)');
    document.documentElement.style.setProperty('--bk-button-secondary-bg', 'rgb(7, 8, 9)');

    expect(getComputedStyle(innerButton(primary)).backgroundColor).to.equal('rgb(4, 5, 6)');
    expect(getComputedStyle(innerButton(secondary)).backgroundColor).to.equal('rgb(7, 8, 9)');
  });

  it('should take its typography from the token instead of inheriting the page font', async () => {
    const button = await mount();
    document.body.style.fontFamily = "'Times New Roman', serif";
    const font = getComputedStyle(innerButton(button)).fontFamily;

    expect(getComputedStyle(document.body).fontFamily).to.include('Times');
    expect(font).to.include('system-ui');
    expect(font).to.not.include('Times');
  });

  it('should take the label weight from the shared typography token', async () => {
    const button = await mount();
    document.documentElement.style.setProperty('--bk-font-weight-medium', '700');

    expect(getComputedStyle(innerButton(button)).fontWeight).to.equal('700');
  });

  it('should take the disabled opacity from its control token', async () => {
    const button = await mount();
    button.disabled = true;
    await button.updateComplete;
    document.documentElement.style.setProperty('--bk-button-disabled-opacity', '0.25');

    expect(getComputedStyle(innerButton(button)).opacity).to.equal('0.25');
  });
});
