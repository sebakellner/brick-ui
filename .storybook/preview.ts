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
  // built the Storybook.
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      const theme = context.globals['theme'] as Theme | undefined;
      const root = document.documentElement;
      // `system` removes the attribute so the media query in theme.css takes
      // over, which is the third way a host can pick a theme and worth showing.
      if (!theme || theme === 'system') root.removeAttribute('data-theme');
      else root.dataset['theme'] = theme;
      return story();
    },
  ],
};

export default preview;
