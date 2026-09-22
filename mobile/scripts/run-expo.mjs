#!/usr/bin/env node
/**
 * Run Expo CLI with monorepo-safe module resolution.
 * Use: npm run start | npm run android (not raw `npx expo start`).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(mobileRoot, '..');
const expoCli = path.join(repoRoot, 'node_modules', 'expo', 'bin', 'cli');
const nodeResolutionSetup = path.join(mobileRoot, 'scripts/setup-node-resolution.cjs');

const nodePath = [
  path.join(mobileRoot, 'node_modules'),
  path.join(repoRoot, 'node_modules'),
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(path.delimiter);

const args = process.argv.slice(2);

const child = spawn(
  process.execPath,
  ['-r', nodeResolutionSetup, expoCli, ...args],
  {
    stdio: 'inherit',
    cwd: mobileRoot,
    env: {
      ...process.env,
      NODE_PATH: nodePath,
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
