import type { Preview } from '@storybook/web-components-vite';

// Tokens are global on purpose: components read the custom properties with a
// fallback, so a host app can re-theme them without importing this file.
import '../src/styles/tokens.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
