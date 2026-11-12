import { esbuildPlugin } from '@web/dev-server-esbuild';
import { sendMousePlugin } from '@web/test-runner-commands/plugins';

export default {
  files: [
    // DIAGNOSTIC
    'src/components/bk-input/bk-input.test.ts',
    'src/components/theming.test.ts',
  ],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto', tsconfig: './tsconfig.json' }),
    sendMousePlugin(),
  ],
  browserLogs: true,
  // Margin, not a fix: the tests that hung on CI did so at 5s too, so the default
  // was never the cause. The commands that cross into the browser — `sendMouse`,
  // `nextFrame` — are round trips, and the default two seconds left an async test
  // with almost no room on a slower runner. Five is the slow end of normal, not a
  // budget for a hang.
  testFramework: {
    config: { timeout: 5000 },
  },
};
