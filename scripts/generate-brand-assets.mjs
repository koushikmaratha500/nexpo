#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const requiredFiles = [
  // Web logos (SVG + retina PNGs)
  'public/brand/logo-master.svg',
  'public/brand/logo-full-mono@1x.png',
  'public/brand/logo-full-mono@2x.png',
  'public/brand/logo-full-mono@3x.png',
  'public/brand/logo-icon-mono.svg',
  'public/brand/logo-icon-mono.png',
  'public/brand/logo-wordmark-mono.svg',
  'public/brand/logo-wordmark-mono.png',
  // Social / email
  'public/brand/og-image.png',
  'public/brand/email-header.png',
  'public/brand/email-header-280x80.png',
  'public/brand/public-receipt-logo.png',
  'public/brand/receipt-logo-360x96.png',
  // Web favicons
  'public/favicon.ico',
  'public/favicon-16.png',
  'public/favicon-32.png',
  'public/apple-touch-icon.png',
  // Mobile app icons
  'mobile/assets/icon.png',
  'mobile/assets/splash-icon.png',
  'mobile/assets/android-icon-foreground.png',
  'mobile/assets/android-icon-background.png',
  'mobile/assets/android-icon-monochrome.png',
  'mobile/assets/favicon.png',
  // Mobile in-app brand logos
  'mobile/assets/brand/logo-full-mono.png',
  'mobile/assets/brand/logo-icon-mono.png',
  'mobile/assets/brand/logo-wordmark-mono.png',
];

const legacyFiles = [
  'public/brand/email-header-560x160.png',
  'public/brand/public-receipt-logo-720x192.png',
  'public/brand/og-image-1200x630.png',
  'public/brand/logo-full-mono.png',
  'public/brand/favicon.ico',
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
const stale = legacyFiles.filter((file) => existsSync(join(root, file)));

if (missing.length > 0) {
  console.error('Missing brand assets:\n' + missing.map((file) => `- ${file}`).join('\n'));
  process.exit(1);
}

if (stale.length > 0) {
  console.error('Legacy brand assets still present (remove after sync):\n' + stale.map((file) => `- ${file}`).join('\n'));
  process.exit(1);
}

console.log(`Brand asset check passed (${requiredFiles.length} required files found).`);
