import { expect } from '@open-wc/testing';

/* A shadow is the one value in the graph nothing verifies: `check:tokens` derives a role's
 * expected property from the first segment of its name, and `elevation` is not a family it
 * knows. These read the computed value the token actually produces, which is the only place a
 * wrong offset or a dropped alpha becomes visible. */

let probe: HTMLDivElement | undefined;

const shadow = (name: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.boxShadow = `var(--brikka-elevation-${name})`;
  return getComputedStyle(probe).boxShadow;
};

describe('elevation', () => {
  it('paints a surface resting on the page', () => {
    expect(shadow('resting')).to.equal('rgba(28, 25, 23, 0.12) 0px 1px 3px 0px');
  });

  it('paints a surface floating above everything', () => {
    expect(shadow('floating')).to.equal('rgba(28, 25, 23, 0.12) 0px 8px 24px -4px');
  });

  /* The colour is a reference inside a composite; if the serializer stopped resolving it, the
   * shadow would still paint — in the wrong colour, or not at all, without an error. */
  it('keeps the alpha of the colour it references', () => {
    expect(shadow('resting')).to.contain('0.12');
  });

  /* One colour retints both levels — but only where the composite is declared. A custom
   * property that contains a `var()` is substituted on the element that declares it, so an
   * override on a subtree does not reach into a composite inherited from `:root`. That is a
   * theme-level knob, and this is the test that says so. */
  it('retints both levels from one colour at the theme', () => {
    const root = document.documentElement;
    root.style.setProperty('--brikka-elevation-color', 'rgb(37 99 235 / 0.4)');
    try {
      expect(shadow('resting')).to.contain('rgba(37, 99, 235, 0.4)');
      expect(shadow('floating')).to.contain('rgba(37, 99, 235, 0.4)');
    } finally {
      root.style.removeProperty('--brikka-elevation-color');
    }
  });
});
