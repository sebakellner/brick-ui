import { expect } from '@open-wc/testing';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

/* The palette is one ramp both themes read, so the pipeline declares it once, at the root, and a
 * theme re-declares only the roles that read it. The difference is a host's to see: a palette
 * override written for the document follows into a `data-theme` container, because that container
 * declares roles, not the ramp.
 *
 * Every check mounts a real subtree, never the root: the failure this covers is a declaration on
 * the container beating the one it would inherit, and no assertion at the root can observe it.
 * `--brikka-text-default` is the role to read because the two themes read different steps of the
 * ramp through it — `neutral-900` in the light theme, `neutral-100` in the dark one — so a value
 * that followed the wrong step, or the wrong theme, cannot pass by coincidence. */

const OVERRIDE = 'rgb(18, 52, 86)';

let container: HTMLDivElement | undefined;

const inTheme = (theme: 'light' | 'dark', token = '--brikka-text-default'): HTMLDivElement => {
  container = document.body.appendChild(document.createElement('div'));
  container.setAttribute('data-theme', theme);
  const probe = document.createElement('div');
  probe.style.color = `var(${token})`;
  container.append(probe);
  return probe;
};

describe('the palette at the root', () => {
  afterEach(() => {
    container?.remove();
    container = undefined;
    document.documentElement.style.removeProperty('--brikka-palette-neutral-900');
    setTheme('light');
  });

  it('lets a palette override reach a light subtree instead of re-declaring the ramp', () => {
    setTheme('light');
    const probe = inTheme('light');
    expect(getComputedStyle(probe).color).to.equal('rgb(28, 25, 23)');

    document.documentElement.style.setProperty('--brikka-palette-neutral-900', OVERRIDE);

    expect(getComputedStyle(probe).color).to.equal(OVERRIDE);
  });

  it('keeps the light roles on a light subtree inside a dark page', () => {
    setTheme('dark');
    const probe = inTheme('light');
    expect(getComputedStyle(probe).color).to.equal('rgb(28, 25, 23)');
  });

  it('keeps the dark roles on a dark subtree inside a light page', () => {
    setTheme('light');
    const probe = inTheme('dark');
    expect(getComputedStyle(probe).color).to.equal('rgb(245, 245, 244)');
  });

  /* The ramp is theme-invariant, and `:root` matches a document under either attribute, so the
   * move must not take the palette away from a page that asked for the dark theme. */
  it('declares the palette on a dark document too', () => {
    setTheme('dark');
    document.documentElement.style.setProperty('--brikka-palette-neutral-900', OVERRIDE);
    const probe = inTheme('dark', '--brikka-bg-surface');
    expect(getComputedStyle(probe).color).to.equal(OVERRIDE);
  });
});
