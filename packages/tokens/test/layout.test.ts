import { expect } from '@open-wc/testing';
import { breakpoints, tokens } from '../src/tokens.generated.js';

/* Three families that a component uses but a custom property cannot always serve: a breakpoint
 * cannot live in `@media`, a `ch` measure is only meaningful as a computed length, and an icon
 * size that aliased a space step has to prove the alias resolved. */

let probe: HTMLDivElement | undefined;

describe('layout, stacking and sizing', () => {
  it('exports breakpoints as numbers a component can interpolate into a query', () => {
    expect(breakpoints).to.deep.equal({ sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 });
  });

  /* A custom property named `--brikka-breakpoint-*` would be a lie: nothing could read it, and
   * a component importing it would get a name, not a value. */
  it('keeps breakpoints out of the custom property names', () => {
    expect(Object.values(tokens).filter((name) => name.includes('breakpoint'))).to.deep.equal([]);
  });

  it('stacks a toast above a modal above a dropdown, with room between them', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.position = 'relative';
    const at = (name: string): number => {
      probe!.style.zIndex = `var(--brikka-z-index-${name})`;
      return Number(getComputedStyle(probe!).zIndex);
    };
    const dropdown = at('dropdown');
    const modal = at('modal');
    const toast = at('toast');
    expect(dropdown).to.equal(100);
    expect(modal).to.equal(300);
    expect(toast).to.equal(400);
    expect(toast).to.be.greaterThan(modal);
    expect(modal).to.be.greaterThan(dropdown);
  });

  /* The alias is the claim, not the pixel value: 16px and 24px would also be produced by a
   * literal. Moving the space step it points at is what proves the alias. */
  it('sizes an icon from the space ramp, not from a second scale', () => {
    const root = document.documentElement;
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.inlineSize = 'var(--brikka-icon-lg)';
    expect(getComputedStyle(probe).width).to.equal('24px');
    root.style.setProperty('--brikka-space-6', '30px');
    try {
      expect(getComputedStyle(probe).width).to.equal('30px');
    } finally {
      root.style.removeProperty('--brikka-space-6');
    }
  });

  /* `ch` is what makes a measure follow the type; a px measure would not move when the font
   * size does. Doubling the font size is the difference the unit has to show. */
  it('measures a line in characters, so it grows with the type', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.maxInlineSize = 'var(--brikka-measure-md)';
    probe.style.fontSize = '16px';
    const at16 = parseFloat(getComputedStyle(probe).maxInlineSize);
    probe.style.fontSize = '32px';
    const at32 = parseFloat(getComputedStyle(probe).maxInlineSize);
    expect(at16).to.be.greaterThan(0);
    expect(at32).to.be.closeTo(at16 * 2, 1);
  });
});
