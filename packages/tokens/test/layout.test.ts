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

  it('sizes an icon from the space ramp rather than from a second scale', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.inlineSize = 'var(--brikka-icon-lg)';
    expect(getComputedStyle(probe).width).to.equal('24px');
    probe.style.inlineSize = 'var(--brikka-icon-sm)';
    expect(getComputedStyle(probe).width).to.equal('16px');
  });

  it('measures a line in characters, not in pixels', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.maxInlineSize = 'var(--brikka-measure-md)';
    /* Chrome resolves the unit: what matters is that the token is a length the browser accepts,
     * and that the wider measure is the wider of the two. */
    const wide = parseFloat(getComputedStyle(probe).maxInlineSize);
    probe.style.maxInlineSize = 'var(--brikka-measure-sm)';
    const narrow = parseFloat(getComputedStyle(probe).maxInlineSize);
    expect(wide).to.be.greaterThan(narrow);
    expect(narrow).to.be.greaterThan(0);
  });
});
