import { esbuildPlugin } from '@web/dev-server-esbuild';
import { sendMousePlugin } from '@web/test-runner-commands/plugins';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  // One file at a time. The suite mixes tests that drive the browser through
  // commands — `sendMouse`, and `updateComplete` inside form fixtures — with tests
  // that force style recalculations over the whole page. Run together, they starve
  // each other: the command-awaiting tests hang, and raising the timeout does not
  // help because the work is not slow, it is not scheduled.
  concurrency: 1,
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
