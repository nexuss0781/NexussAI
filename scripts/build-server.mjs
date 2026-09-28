import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const nodeBuiltins = [
  'assert', 'buffer', 'child_process', 'crypto', 'dns', 'events', 'fs', 'http', 'https',
  'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline', 'stream',
  'string_decoder', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
];

// express/dotenv/vite come from the deployment's node_modules. The NAR SDK is deliberately
// NOT external: it is ESM-only, so it is compiled into this CommonJS bundle rather than
// require()d at runtime, which keeps the edge start free of ESM/CJS interop.
const external = ['express', 'dotenv', 'vite', ...nodeBuiltins, ...nodeBuiltins.map((n) => `node:${n}`)];

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
