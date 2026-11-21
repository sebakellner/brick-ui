import { expect } from '@open-wc/testing';

/* The state roles end the practice of fading a whole control with `--brikka-opacity-disabled`:
 * a disabled control now has a surface, an ink and a border of its own, so its geometry and its
 * label stay identifiable while the contrast drops. These read the values; the contrast pairs
 * they form are measured in `odd/tasks/token-inventory.md`. */

let probe: HTMLDivElement | undefined;

const paint = (property: 'background' | 'color', token: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.setProperty(property, `var(${token})`);
  return property === 'background'
    ? getComputedStyle(probe).backgroundColor
    : getComputedStyle(probe).color;
};

describe('state roles', () => {
  it('dims the page under a floating surface with an alpha a scrim needs', () => {
    expect(paint('background', '--brikka-bg-scrim')).to.equal('rgba(28, 25, 23, 0.48)');
  });

  it('gives a disabled control its own ink, not the body ink at lower opacity', () => {
    const disabled = paint('color', '--brikka-text-disabled');
    expect(disabled).to.not.equal(paint('color', '--brikka-text-default'));
    expect(disabled).to.not.equal(paint('color', '--brikka-text-muted'));
  });

  it('separates a chosen row from its text', () => {
    const surface = paint('background', '--brikka-bg-selected');
    const ink = paint('color', '--brikka-text-on-selected');
    expect(surface).to.be.a('string').and.not.be.empty;
    expect(ink).to.be.a('string').and.not.be.empty;
    expect(surface).to.not.equal(ink);
  });

  /* The scrim is the one role whose value is a literal with alpha rather than a palette step:
   * a palette entry has no alpha to give, and both themes need a different one. */
  it('carries a heavier scrim in the dark theme', async () => {
    const css = await (await fetch('/packages/tokens/src/tokens/color.dark.css')).text();
    expect(css).to.contain('--brikka-bg-scrim: rgb(28 25 23 / 0.64);');
  });

  it('keeps pressed distinct from hover, one step further from rest', () => {
    const rest = paint('background', '--brikka-bg-surface');
    const hover = paint('background', '--brikka-bg-surface-hover');
    const pressed = paint('background', '--brikka-bg-surface-pressed');
    expect(new Set([rest, hover, pressed]).size).to.equal(3);
  });
});
