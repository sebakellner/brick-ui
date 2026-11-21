import { expect } from '@open-wc/testing';

/* Sizes and border widths are the two families a component reaches for when it has to paint a
 * subject rather than a control. Both are additive: `border-width` keeps its 1px, and `size`
 * aliases the space ramp instead of opening a third scale next to it. */

let probe: HTMLDivElement | undefined;

const box = (property: 'inlineSize' | 'borderTopWidth', token: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  if (property === 'borderTopWidth') probe.style.borderStyle = 'solid';
  probe.style[property] = `var(${token})`;
  return property === 'inlineSize'
    ? getComputedStyle(probe).width
    : getComputedStyle(probe).borderTopWidth;
};

describe('size and border width', () => {
  it('scales media squares along the space ramp', () => {
    const sizes: [string, string][] = [
      ['sm', '32px'],
      ['md', '40px'],
      ['lg', '48px'],
      ['xl', '64px'],
    ];
    for (const [step, px] of sizes) expect(box('inlineSize', `--brikka-size-${step}`)).to.equal(px);
  });

  /* The alias is the claim: a hardcoded 32px would also pass the test above. */
  it('proves every alias by moving the step it points at', () => {
    const root = document.documentElement;
    const aliases: [string, string][] = [
      ['--brikka-space-8', '--brikka-size-sm'],
      ['--brikka-space-10', '--brikka-size-md'],
      ['--brikka-space-12', '--brikka-size-lg'],
      ['--brikka-space-16', '--brikka-size-xl'],
    ];
    for (const [step, size] of aliases) {
      const before = box('inlineSize', size);
      root.style.setProperty(step, '37px');
      try {
        expect(box('inlineSize', size)).to.equal('37px');
      } finally {
        root.style.removeProperty(step);
      }
      expect(before).to.not.equal('37px');
    }
  });

  /* `border-width` is read by thirteen component files, so it had to keep its 1px: the thick
   * boundary is a second name, not a redefinition of the first. */
  it('keeps the default boundary and adds a thicker one', () => {
    expect(box('borderTopWidth', '--brikka-border-width')).to.equal('1px');
    expect(box('borderTopWidth', '--brikka-border-width-thick')).to.equal('2px');
  });
});
