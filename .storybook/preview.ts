import type { Preview } from '@storybook/web-components-vite';

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
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      const theme = context.globals['theme'] as Theme | undefined;
      const root = document.documentElement;
      if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
      else root.removeAttribute('data-theme');
      return story();
    },
  ],
};

export default preview;
