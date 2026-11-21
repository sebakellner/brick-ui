import { expect } from '@open-wc/testing';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

/* The two axes a host turns instead of editing forty tokens, and the halo that stopped being the
 * only colour in the graph that did not come from the palette.
 *
 * Each check is a two-sided one: the value at the default has to be what the kit designed, and
 * the value after moving the knob has to follow. Proving only the first would pass for a literal,
 * and proving only the second would pass for any formula. */

let probe: HTMLDivElement | undefined;

const at = (property: string, token: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.setProperty(property, `var(${token})`);
  return getComputedStyle(probe)[property === 'font-size' ? 'fontSize' : 'height'];
};

describe('the parametric foundations', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--brikka-scale-type');
    document.documentElement.style.removeProperty('--brikka-scale-density');
    setTheme('light');
  });

  it('computes every font size from one type scale', () => {
    expect(at('font-size', '--brikka-font-size-md')).to.equal('15px');
    document.documentElement.style.setProperty('--brikka-scale-type', '2');
    expect(at('font-size', '--brikka-font-size-md')).to.equal('30px');
  });

  it('keeps the text styles on the same scale, so a composite follows it too', () => {
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.font = 'var(--brikka-typography-body-md)';
    expect(getComputedStyle(probe).fontSize).to.equal('15px');
    document.documentElement.style.setProperty('--brikka-scale-type', '2');
    expect(getComputedStyle(probe).fontSize).to.equal('30px');
  });

  it('computes the control height from one density', () => {
    expect(at('height', '--brikka-control-height')).to.equal('40px');
    document.documentElement.style.setProperty('--brikka-scale-density', '0.8');
    expect(at('height', '--brikka-control-height')).to.equal('32px');
  });

  /* The halo used to be a literal `rgb(37 99 235 / 0.18)`: change the ramp to violet and the
   * focus ring followed while the halo stayed blue. Chrome computes a `color-mix` in oklab and
   * keeps it there, so the assertion is about the alpha and about following the palette, not
   * about a serialized colour. */
  it('derives the focus halo from the accent, so it follows the ramp', () => {
    setTheme('light');
    probe ??= document.body.appendChild(document.createElement('div'));
    probe.style.outline = '2px solid var(--brikka-focus-halo)';
    const before = getComputedStyle(probe).outlineColor;
    expect(before).to.contain('/ 0.18');

    const root = document.documentElement;
    root.style.setProperty('--brikka-palette-blue-600', 'oklch(0.55 0.2 300)');
    try {
      expect(getComputedStyle(probe).outlineColor).to.not.equal(before);
    } finally {
      root.style.removeProperty('--brikka-palette-blue-600');
    }
  });
});
