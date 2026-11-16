import { esbuildPlugin } from '@web/dev-server-esbuild';
import { chromeLauncher } from '@web/test-runner-chrome';
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
  /* Headless Chrome has no pointer device, so it reports `(hover: none)` and every
   * `@media (hover: hover)` rule stays out of the cascade. `primaryHoverType=2` is
   * hover (1 is none). Two things learned the hard way elsewhere: any viewport
   * emulation afterwards rewrites these and undoes the flag, so the suite must not
   * call `setViewport`; and the flag is Blink-only, which is why the hover tests
   * still skip on an engine that has no pointer. */
  browsers: [
    chromeLauncher({
      launchOptions: { args: ['--blink-settings=primaryHoverType=2'] },
    }),
  ],
  testFramework: {
    config: { timeout: 5000 },
  },
};
