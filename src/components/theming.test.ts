import { expect, fixture, html } from '@open-wc/testing';
import './bk-button/bk-button.js';
import type { BkButton } from './bk-button/bk-button.js';
import { loadTheme, setTheme } from '../test/helpers/theme.js';

const hex = (value: string) =>
  `rgb(${parseInt(value.slice(1, 3), 16)}, ${parseInt(value.slice(3, 5), 16)}, ${parseInt(
    value.slice(5, 7),
    16,
  )})`;

/** Resolves a role the way a component would: through the custom property chain. */
let probe: HTMLDivElement | undefined;

/**
 * Resolves a role the way a component would, through one reusable probe. The
 * thirteen-role matrix used to build, append, measure and remove a div per role;
 * each one forced a recalculation of the whole page, which is what starved the
 * browser-command tests that used to run alongside this file.
 */
const role = (name: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.color = `var(--bk-${name})`;
  return getComputedStyle(probe).color;
};

const LIGHT: Record<string, string> = {
  'bg-surface': '#ffffff',
  'bg-surface-muted': '#f5f5f4',
  'bg-surface-hover': '#e7e5e4',
  'bg-accent': '#2563eb',
  'bg-accent-hover': '#1d4ed8',
  'text-default': '#1c1917',
  'text-muted': '#57534e',
  'text-on-accent': '#ffffff',
  'text-danger': '#b91c1c',
  'border-default': '#78716c',
  'border-strong': '#57534e',
  'border-danger': '#b91c1c',
  'focus-ring': '#0284c7',
};

const DARK: Record<string, string> = {
  'bg-surface': '#1c1917',
  'bg-surface-muted': '#292524',
  'bg-surface-hover': '#44403c',
  'bg-accent': '#2563eb',
  'bg-accent-hover': '#1d4ed8',
  'text-default': '#f5f5f4',
  'text-muted': '#a8a29e',
  'text-on-accent': '#ffffff',
  'text-danger': '#f87171',
  'border-default': '#78716c',
  'border-strong': '#a8a29e',
  'border-danger': '#f87171',
  'focus-ring': '#38bdf8',
};

describe('theming', () => {
  before(() => loadTheme());

  afterEach(() => {
    probe?.remove();
    probe = undefined;
  });

  describe('light', () => {
    beforeEach(() => setTheme('light'));

    it('should resolve all thirteen roles to the light palette', () => {
      for (const [name, value] of Object.entries(LIGHT)) {
        expect(role(name), `--bk-${name}`).to.equal(hex(value));
      }
    });

    it('should paint a button from the light roles', async () => {
      const button = await fixture<BkButton>(html`<bk-button>Save</bk-button>`);
      const style = getComputedStyle(button.shadowRoot!.querySelector('button')!);

      expect(style.backgroundColor).to.equal(hex('#2563eb'));
      expect(style.color).to.equal(hex('#ffffff'));
    });
  });

  describe('dark', () => {
    beforeEach(() => setTheme('dark'));

    it('should resolve all thirteen roles to the dark palette', () => {
      for (const [name, value] of Object.entries(DARK)) {
        expect(role(name), `--bk-${name}`).to.equal(hex(value));
      }
    });

    it('should paint a button from the dark roles', async () => {
      const button = await fixture<BkButton>(html`<bk-button>Save</bk-button>`);
      const style = getComputedStyle(button.shadowRoot!.querySelector('button')!);

      expect(style.backgroundColor).to.equal(hex('#2563eb'));
      expect(style.color).to.equal(hex('#ffffff'));
    });

    it('should theme a subtree without changing the document root', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-theme', 'dark');
      const probe = document.createElement('div');
      probe.style.color = 'var(--bk-bg-surface)';
      wrapper.append(probe);
      document.body.append(wrapper);
      setTheme('light');

      expect(getComputedStyle(probe).color).to.equal(hex('#1c1917'));
      wrapper.remove();
    });
  });

  // `emulateMedia` is deliberately not used here. Two tests that emulated a colour
  // scheme made four unrelated `bk-input` tests hang on CI — one on `sendMouse`, three
  // on `updateElement` inside form fixtures — and the emulation was the only new
  // browser-level command in the change. What the assertions below cover is the two
  // things that actually broke: the media block existing, and it being loaded.
  describe('system preference', () => {
    it('should ship the system-preference block and load it', async () => {
      const theme = await (await fetch('/src/styles/theme.css')).text();
      const block = await (await fetch('/src/styles/tokens/color.dark.media.css')).text();

      expect(theme, 'the dark media block is imported').to.include(
        "@import './tokens/color.dark.media.css';",
      );
      expect(theme, 'the page is told which way to paint').to.include('color-scheme: dark');
      expect(block, 'the block is a media query').to.include(
        '@media (prefers-color-scheme: dark)',
      );
      expect(block, 'it yields to an explicit theme').to.include(':where(:root:not([data-theme]))');
    });
  });
});
