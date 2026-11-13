import { esbuildPlugin } from '@web/dev-server-esbuild';
import { sendMousePlugin } from '@web/test-runner-commands/plugins';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  // Contention, not timeouts: the role matrix recalculated the whole page while
  // bk-input awaited browser commands, and three CI runs were lost to it.
  concurrency: 1,
  plugins: [
    // Without the tsconfig, esbuild applies its own decorator transform and the
    // browser reports "Invalid or unexpected token", which names no cause.
    esbuildPlugin({ ts: true, target: 'auto', tsconfig: './tsconfig.json' }),
    sendMousePlugin(),
  ],
  browserLogs: true,
  testFramework: {
    config: { timeout: 5000 },
  },
};
