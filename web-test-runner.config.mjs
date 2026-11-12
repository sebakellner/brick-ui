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
};
