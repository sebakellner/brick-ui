import { expect, fixture, html } from '@open-wc/testing';
import { emulateMedia } from '@web/test-runner-commands';
import './bk-button/bk-button.js';
import type { BkButton } from './bk-button/bk-button.js';
import { loadTheme, setTheme } from '../test/helpers/theme.js';

const hex = (value: string) =>
  `rgb(${parseInt(value.slice(1, 3), 16)}, ${parseInt(value.slice(3, 5), 16)}, ${parseInt(
    value.slice(5, 7),
    16,
  )})`;

/** Resolves a role the way a component would: through the custom property chain. */
const role = (name: string): string => {
  const probe = document.createElement('div');
  probe.style.color = `var(--bk-${name})`;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
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

  describe('system preference', () => {
    afterEach(() => emulateMedia({ colorScheme: 'no-preference' }));

    it('should follow the system when the host chose no theme', async () => {
      document.documentElement.removeAttribute('data-theme');

      await emulateMedia({ colorScheme: 'dark' });
      expect(role('bg-surface'), 'dark preference').to.equal(hex('#1c1917'));

      await emulateMedia({ colorScheme: 'light' });
      expect(role('bg-surface'), 'light preference').to.equal(hex('#ffffff'));
    });

    it('should let an explicit theme win over the system preference', async () => {
      await emulateMedia({ colorScheme: 'dark' });
      setTheme('light');

      expect(role('bg-surface')).to.equal(hex('#ffffff'));
    });
  });
});
