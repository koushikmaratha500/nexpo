#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const requiredFiles = [
  'public/brand/og-image.png',
  'public/brand/email-header-560x160.png',
  'public/brand/public-receipt-logo-720x192.png',
  'public/brand/logo-full-mono@2x.png',
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  'mobile/assets/icon.png',
  'mobile/assets/brand/logo-full-mono.png',
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error('Missing brand assets:\n' + missing.map((file) => `- ${file}`).join('\n'));
  process.exit(1);
}

console.log(`Brand asset check passed (${requiredFiles.length} required files found).`);
