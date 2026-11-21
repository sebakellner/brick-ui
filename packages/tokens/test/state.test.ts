import { expect } from '@open-wc/testing';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

/* The state roles end the practice of fading a whole control with `--brikka-opacity-disabled`:
 * a disabled control now has a surface, an ink and a border of its own, so its geometry and its
 * label stay identifiable while the contrast drops.
 *
 * Every value here is asserted exactly and under a pinned theme. Two reasons, both learned the
 * hard way: an inequality (`disabled !== default`) passes when the token does not resolve at all
 * and the probe inherits body ink, and the scrim is theme-scoped, so under a dark colour scheme
 * the light assertion reads the dark value and fails on someone else's machine. */

let probe: HTMLDivElement | undefined;

const paint = (property: 'background' | 'color', token: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.setProperty(property, `var(${token})`);
  return property === 'background'
    ? getComputedStyle(probe).backgroundColor
    : getComputedStyle(probe).color;
};

describe('state roles', () => {
  afterEach(() => setTheme('light'));

  it('dims the page under a floating surface with an alpha a scrim needs', () => {
    setTheme('light');
    expect(paint('background', '--brikka-bg-scrim')).to.equal('rgba(28, 25, 23, 0.48)');
    setTheme('dark');
    expect(paint('background', '--brikka-bg-scrim')).to.equal('rgba(28, 25, 23, 0.64)');
  });

  it('gives a disabled control its own ink, not the body ink at lower opacity', () => {
    setTheme('light');
    /* neutral-500: below body contrast on purpose, above the point where a label is unreadable. */
    expect(paint('color', '--brikka-text-disabled')).to.equal('rgb(120, 113, 108)');
  });

  it('separates a chosen row from its text', () => {
    setTheme('light');
    expect(paint('background', '--brikka-bg-selected')).to.equal('rgb(219, 234, 254)');
    expect(paint('color', '--brikka-text-on-selected')).to.equal('rgb(28, 25, 23)');
  });

  it('burns the chosen row into the dark theme too', () => {
    setTheme('dark');
    expect(paint('background', '--brikka-bg-selected')).to.equal('rgb(30, 58, 138)');
    expect(paint('color', '--brikka-text-on-selected')).to.equal('rgb(245, 245, 244)');
  });

  it('keeps pressed distinct from hover, one step further from rest', () => {
    setTheme('light');
    expect(paint('background', '--brikka-bg-surface')).to.equal('rgb(255, 255, 255)');
    expect(paint('background', '--brikka-bg-surface-hover')).to.equal('rgb(231, 229, 228)');
    expect(paint('background', '--brikka-bg-surface-pressed')).to.equal('rgb(214, 211, 209)');
  });

  it('gives a disabled control a surface and a border of its own', () => {
    setTheme('light');
    expect(paint('background', '--brikka-bg-disabled')).to.equal('rgb(231, 229, 228)');
    expect(paint('color', '--brikka-text-disabled')).to.equal('rgb(120, 113, 108)');
  });
});
