import { expect } from '@open-wc/testing';

/* `--brikka-transition` is a transition composite that components splice into a declaration of
 * their own: `transition: border-color var(--brikka-transition)`. Two things can break that
 * without any error: the parts can stop composing into a valid shorthand, and the reduced-motion
 * override — a bare duration — can stop being valid against a composite value. */

let probe: HTMLDivElement | undefined;

const transition = (value: string): CSSStyleDeclaration => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.transition = value;
  return getComputedStyle(probe);
};

describe('motion', () => {
  it('composes the duration and the easing into a transition a component can splice', () => {
    const style = transition('color var(--brikka-duration-base) var(--brikka-easing-standard) 0ms');
    expect(style.transitionDuration).to.equal('0.15s');
    expect(style.transitionTimingFunction).to.equal('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('keeps the scale apart, so one duration can be swapped for another', () => {
    expect(transition('color var(--brikka-duration-fast) 0ms').transitionDuration).to.equal('0.1s');
    expect(transition('color var(--brikka-duration-slow) 0ms').transitionDuration).to.equal(
      '0.25s',
    );
  });

  /* The generated artifact is the contract here: the page overrides the token to `0s` so the
   * suite never waits on an animation, which means the composite's own value is only observable
   * in the file. */
  it('declares the token as the three parts, not as a literal', async () => {
    const css = await (await fetch('/packages/tokens/src/tokens/base.css')).text();
    expect(css).to.contain(
      '--brikka-transition: var(--brikka-duration-base) var(--brikka-easing-standard) 0ms;',
    );
  });

  /* theme.css replaces the whole token with `1ms` under reduced motion, which is R7. A bare
   * duration has to stay valid where a composite was, or reduced motion silently stops
   * applying. */
  it('accepts the bare duration the reduced-motion block substitutes', () => {
    const style = transition('color var(--brikka-transition)');
    expect(style.transitionDuration).to.equal('0s');
  });
});
