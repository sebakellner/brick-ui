import { expect } from '@open-wc/testing';

/* The two multipliers a host turns — density and the type scale — used to be free: a host could
 * compute a control below the target WCAG 2.2 AA asks for, and a font size no screen renders
 * legibly. Each axis now carries a floor inside the expression that already computes it, so the
 * accessibility promise holds for a host that never read this source.
 *
 * Every check is two-sided, like `scale-knobs.test.ts`: the floor has to hold where a host asked
 * for less, and a value above it has to keep following the axis. A floor that pinned every value
 * at the minimum would pass the first half and fail the second. */

let probe: HTMLDivElement | undefined;

const root = (): CSSStyleDeclaration => document.documentElement.style;

const controlHeight = (): number => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.height = 'var(--brikka-control-height)';
  return parseFloat(getComputedStyle(probe).height);
};

const fontSize = (step: string): number => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.fontSize = `var(--brikka-font-size-${step})`;
  return parseFloat(getComputedStyle(probe).fontSize);
};

describe('the floors under the two configuration axes', () => {
  afterEach(() => {
    root().removeProperty('--brikka-scale-density');
    root().removeProperty('--brikka-scale-type');
  });

  /* 2.5.8 asks for a 24 by 24 CSS pixel target, and 24px is what the floor computes: the
   * requirement, not a target above it. Density 0.3 computed 12px before the floor, half of it. */
  it('holds the control height at 24px when the density is below the floor', () => {
    root().setProperty('--brikka-scale-density', '0.3');
    expect(controlHeight()).to.be.at.least(24);
  });

  /* `xs` is 0.75rem, so the documented minimum multiplier of 0.875 puts it at 10.5px. At 0.5 it
   * computed 6px, which the description this token carries never offered. */
  it('holds the smallest font size at 10.5px when the type scale is below the floor', () => {
    root().setProperty('--brikka-scale-type', '0.5');
    expect(fontSize('xs')).to.be.at.least(10.5);
  });

  /* A floor is not a pin: the designed values above it still follow their axis. */
  it('leaves the control height at the designed 40px when the density is 1', () => {
    expect(controlHeight()).to.equal(40);
  });

  it('leaves the smallest font size on the axis at the documented dense value', () => {
    root().setProperty('--brikka-scale-type', '1.125');
    expect(fontSize('xs')).to.equal(13.5);
  });
});
