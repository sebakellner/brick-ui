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
  /* The theme and an instant-transition page load once for every suite. The theme used
   * to be fetched by each test file; the transitions used to be waited out with a timer.
   * Both are environment, not test. */
  testRunnerHtml: (testFramework) => `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/src/styles/theme.css" />
    <style>
      /* A universal transition: none !important does not reach into a shadow root —
       * measured: the component's own 0.12s survived it, and the assertion sampled an
       * interpolated colour. Custom properties do inherit, so the kit's own duration
       * token is what the test page zeroes. */
      :root {
        --bk-transition: 0s;
      }
    </style>
  </head>
  <body>
    <script type="module" src="${testFramework}"></script>
  </body>
</html>`,
  browserLogs: true,
  /* 2 is hover, 1 is none. Why the flag exists, and the two ways it breaks:
   * docs/conventions-testing.md, T7. */
  browsers: [
    chromeLauncher({
      launchOptions: { args: ['--blink-settings=primaryHoverType=2'] },
    }),
  ],
  testFramework: {
    config: { timeout: 5000 },
  },
};
