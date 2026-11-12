import type { Preview } from '@storybook/web-components-vite';

// Tokens are global on purpose: components read the custom properties with a
// fallback, so a host app can re-theme them without importing this file.
import '../src/styles/theme.css';
import './preview.css';

type Theme = 'light' | 'dark' | 'system';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Token theme for the preview',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'system', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
  // Deterministic by default: without a `data-theme` the role layer follows the
  // operating system through `prefers-color-scheme`, and the canvas keeps
  // Storybook's own background, which is how a dark role set ends up on a white
  // page. Pinning light makes what you see depend on the toolbar, not on whoever
  // built the Storybook. The same value is written again in `preview-head.html`,
  // which lands before the first paint; this one governs what the decorator sets
  // on every render. Change both.
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      const theme = context.globals['theme'] as Theme | undefined;
      const root = document.documentElement;
      // Only the two themes the tokens define are written. `system` — and any
      // stale global carried in an old URL — removes the attribute instead, so
      // the media query decides. Writing an unrecognised name would match no
      // rule at all and leave the light roles in place while claiming otherwise.
      if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
      else root.removeAttribute('data-theme');
      return story();
    },
  ],
};

export default preview;
