require('./scripts/setup-node-resolution.cjs');

const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const mobileTailwind = path.resolve(mobileNodeModules, 'tailwindcss');

function resolvePackageDir(packageName) {
  const candidates = [
    path.join(mobileNodeModules, packageName),
    path.join(workspaceNodeModules, packageName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const singletonPackages = [
  'nativewind',
  'react-native-css-interop',
  'expo-router',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation/native',
  '@react-navigation/bottom-tabs',
  '@react-navigation/elements',
  'react-native-reanimated',
];

const extraNodeModules = {
  tailwindcss: mobileTailwind,
};

for (const packageName of singletonPackages) {
  const resolved = resolvePackageDir(packageName);
  if (resolved) {
    extraNodeModules[packageName] = resolved;
  }
}

const config = getDefaultConfig(projectRoot);

// Monorepo: resolve hoisted deps from repo root, but do not crawl the Next.js app.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [mobileNodeModules, workspaceNodeModules];
config.resolver.extraNodeModules = extraNodeModules;

const escape = (value) => value.replace(/[/\\]/g, '[\\\\/]');
const block = (...segments) => new RegExp(`${escape(path.join(workspaceRoot, ...segments))}[\\\\/].*`);

const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList]).filter(Boolean),
  block('app'),
  block('.next'),
  block('lib'),
  block('prisma'),
  block('components'),
  block('hooks'),
  block('store'),
  block('tests'),
  block('scripts'),
  block('trigger'),
  block('mobile', 'android'),
  block('mobile', 'ios'),
  // Prevent nested duplicates from being bundled separately.
  /[\\/]expo-router[\\/]node_modules[\\/]react-native-screens[\\/]/,
  /[\\/]nativewind[\\/]node_modules[\\/]react-native-css-interop[\\/]/,
  /\.git[\\/]/,
];

module.exports = withNativeWind(config, {
  input: path.resolve(projectRoot, 'global.css'),
  configPath: path.resolve(projectRoot, 'tailwind.config.js'),
});
