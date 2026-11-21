import { expect } from '@open-wc/testing';

/* The spacing scale is parametric — every step is `calc(base * n)` — so a step is only correct
 * if the arithmetic survives custom-property substitution. The radii alias space steps for the
 * same reason, which means a broken space step shows up in both files. */

let probe: HTMLDivElement | undefined;

const computed = (
  property: string,
  value: string,
  output: 'paddingRight' | 'borderTopLeftRadius',
): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.setProperty(property, value);
  return getComputedStyle(probe)[output];
};

describe('scale', () => {
  it('grows the spacing ramp to layout sizes, from the same base', () => {
    expect(computed('padding-inline', 'var(--brikka-space-8)', 'paddingRight')).to.equal('32px');
    expect(computed('padding-inline', 'var(--brikka-space-16)', 'paddingRight')).to.equal('64px');
    expect(computed('padding-inline', 'var(--brikka-space-5)', 'paddingRight')).to.equal('20px');
  });

  /* The scale has to rescale from one value: that is the whole point of `base` being a token
   * rather than five literals. */
  it('rescales the whole ramp when the base changes', () => {
    const root = document.documentElement;
    root.style.setProperty('--brikka-space-base', '8px');
    try {
      expect(computed('padding-inline', 'var(--brikka-space-4)', 'paddingRight')).to.equal('32px');
    } finally {
      root.style.removeProperty('--brikka-space-base');
    }
  });

  it('rounds nothing and stops at zero', () => {
    expect(computed('padding-inline', 'var(--brikka-space-0)', 'paddingRight')).to.equal('0px');
    expect(computed('padding-inline', 'var(--brikka-space-1)', 'paddingRight')).to.equal('4px');
  });

  it('aliases the radii to the space steps', () => {
    expect(computed('border-radius', 'var(--brikka-radius-md)', 'borderTopLeftRadius')).to.equal(
      '8px',
    );
    expect(computed('border-radius', 'var(--brikka-radius-xl)', 'borderTopLeftRadius')).to.equal(
      '24px',
    );
  });

  /* `none` is a reset and `full` is the geometry a pill requires; ADR 0004 allows those two
   * literals and nothing else. */
  it('offers the reset and the pill as literals', () => {
    expect(computed('border-radius', 'var(--brikka-radius-none)', 'borderTopLeftRadius')).to.equal(
      '0px',
    );
    expect(computed('border-radius', 'var(--brikka-radius-full)', 'borderTopLeftRadius')).to.equal(
      '9999px',
    );
  });
});
