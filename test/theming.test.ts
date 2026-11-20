import { expect, fixture, html } from '@open-wc/testing';
import '../packages/web-components/src/components/brikka-button/define.js';
import type { BrikkaButton } from '../packages/web-components/src/components/brikka-button/brikka-button.js';
import { setTheme } from '@brikka-ui/test-utils/theme.js';

const hex = (value: string) =>
  `rgb(${parseInt(value.slice(1, 3), 16)}, ${parseInt(value.slice(3, 5), 16)}, ${parseInt(
    value.slice(5, 7),
    16,
  )})`;

let probe: HTMLDivElement | undefined;

const role = (name: string): string => {
  probe ??= document.body.appendChild(document.createElement('div'));
  probe.style.color = `var(--brikka-${name})`;
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
  afterEach(() => {
    probe?.remove();
    probe = undefined;
  });

  describe('light', () => {
    beforeEach(() => setTheme('light'));

    it('should resolve all thirteen roles to the light palette', () => {
      for (const [name, value] of Object.entries(LIGHT)) {
        expect(role(name), `--brikka-${name}`).to.equal(hex(value));
      }
    });

    it('should paint a button from the light roles', async () => {
      const button = await fixture<BrikkaButton>(html`<brikka-button>Save</brikka-button>`);
      const style = getComputedStyle(button.shadowRoot!.querySelector('button')!);

      expect(style.backgroundColor).to.equal(hex('#2563eb'));
      expect(style.color).to.equal(hex('#ffffff'));
    });
  });

  describe('dark', () => {
    beforeEach(() => setTheme('dark'));

    it('should resolve all thirteen roles to the dark palette', () => {
      for (const [name, value] of Object.entries(DARK)) {
        expect(role(name), `--brikka-${name}`).to.equal(hex(value));
      }
    });

    it('should paint a button from the dark roles', async () => {
      const button = await fixture<BrikkaButton>(html`<brikka-button>Save</brikka-button>`);
      const style = getComputedStyle(button.shadowRoot!.querySelector('button')!);

      expect(style.backgroundColor).to.equal(hex('#2563eb'));
      expect(style.color).to.equal(hex('#ffffff'));
    });

    it('should theme a subtree without changing the document root', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-theme', 'dark');
      const probe = document.createElement('div');
      probe.style.color = 'var(--brikka-bg-surface)';
      wrapper.append(probe);
      document.body.append(wrapper);
      setTheme('light');

      expect(getComputedStyle(probe).color).to.equal(hex('#1c1917'));
      wrapper.remove();
    });
  });

  describe('system preference', () => {
    for (const theme of ['light', 'dark'] as const) {
      it(`should tell the platform which scheme it paints (${theme})`, () => {
        setTheme(theme);

        expect(
          getComputedStyle(document.documentElement).colorScheme,
          'native widgets follow the theme the page declares',
        ).to.equal(theme);
      });
    }

    it('should let an explicit theme win over the system block', () => {
      setTheme('dark');
      expect(role('bg-surface'), 'dark is what the attribute asks for').to.equal(
        hex(DARK['bg-surface']!),
      );

      document.documentElement.dataset['theme'] = 'light';
      probe!.style.color = 'var(--brikka-bg-surface)';

      expect(
        getComputedStyle(probe!).color,
        'the attribute decides, wherever the system stands',
      ).to.equal(hex(LIGHT['bg-surface']!));
      expect(getComputedStyle(document.documentElement).colorScheme).to.equal('light');
    });
  });
});
