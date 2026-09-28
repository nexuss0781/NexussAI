import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const nodeBuiltins = [
  'assert', 'buffer', 'child_process', 'crypto', 'dns', 'events', 'fs', 'http', 'https',
  'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline', 'stream',
  'string_decoder', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
];

// Only Node builtins and vite stay external. express, dotenv and the NAR SDK are compiled
// in so the bundle is self-contained: the deployed webc carries no node_modules, so a
// bare require() of express would crash the process at boot.
const external = ['vite', ...nodeBuiltins, ...nodeBuiltins.map((n) => `node:${n}`)];

await build({
  entryPoints: [path.join(root, 'server.ts')],
  outfile: path.join(root, 'src/server.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external,
  sourcemap: false,
  logLevel: 'info',
  banner: {
    js: '// Generated from server.ts by scripts/build-server.mjs. Do not edit by hand.',
  },
});
