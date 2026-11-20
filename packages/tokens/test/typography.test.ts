import { expect } from '@open-wc/testing';

/* The page loads `theme.css` for every test file (web-test-runner.config.mjs), so these read
 * the tokens a consumer would get. `font` is a shorthand whose value here is four `var()`
 * references: if any of them fails to resolve, the whole declaration becomes invalid at
 * computed-value time and the browser silently keeps the default instead of erroring. That is
 * the failure this suite exists to catch, and it is invisible in the generated CSS. */

let probe: HTMLDivElement | undefined;

const text = (composite: string): CSSStyleDeclaration => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.font = `var(--brikka-typography-${composite})`;
  return getComputedStyle(probe);
};

describe('the text styles', () => {
  it('sets all four parts of a heading from one declaration', () => {
    const style = text('heading-lg');
    expect(style.fontWeight).to.equal('600');
    expect(style.fontSize).to.equal('28px');
    expect(style.lineHeight).to.equal('35px');
    expect(style.fontFamily).to.contain('ui-sans-serif');
  });

  it('sets running text at the body weight and the body line height', () => {
    const style = text('body-md');
    expect(style.fontWeight).to.equal('400');
    expect(style.fontSize).to.equal('15px');
    expect(style.lineHeight).to.equal('22.5px');
  });

  it('sets a label smaller and tighter than body text', () => {
    const style = text('label-md');
    expect(style.fontWeight).to.equal('500');
    expect(style.fontSize).to.equal('13px');
    expect(style.lineHeight).to.equal('16.25px');
  });

  /* Documented in ADR 0031: `font` resets style, variant and width along with the four it
   * sets, so a separate `font-size` written before a composite does not survive it. */
  it('overrides a size written before it, because the shorthand resets what it sets', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.fontSize = '20px';
    probe.style.font = 'var(--brikka-typography-heading-lg)';
    expect(getComputedStyle(probe).fontSize).to.equal('28px');
  });
});
