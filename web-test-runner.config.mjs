import { esbuildPlugin } from '@web/dev-server-esbuild';
import { sendMousePlugin } from '@web/test-runner-commands/plugins';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto', tsconfig: './tsconfig.json' }),
    sendMousePlugin(),
  ],
  browserLogs: true,
  // The default 2s per test is tight for commands that cross into the browser:
  // `sendMouse` and `emulateMedia` are round trips, and on a slower runner an
  // async test that waits on one can spend most of its budget there rather than
  // in the assertion. The suite runs in 1.3s locally; on CI it started timing out
  // once the theme added two stylesheets and a media emulation.
  testFramework: {
    config: { timeout: 5000 },
  },
};
