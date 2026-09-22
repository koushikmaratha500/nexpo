/**
 * Monorepo module resolution for Expo CLI + Metro.
 * - tailwindcss v3 from mobile/ (not v4 from Next.js at repo root)
 * - expo-router from mobile/
 * - react-native-css-interop from mobile/ (single copy for NativeWind runtime)
 */
const path = require('path');
const Module = require('module');

const mobileRoot = path.resolve(__dirname, '..');
const mobileNodeModules = path.join(mobileRoot, 'node_modules');
const workspaceNodeModules = path.join(mobileRoot, '..', 'node_modules');

if (Module._resolveFilename.__nexpoMobilePatched) {
  return;
}

const originalResolveFilename = Module._resolveFilename;

function resolveFromPaths(request, searchPaths) {
  return originalResolveFilename.call(
    Module,
    request,
    { paths: searchPaths },
    false,
    undefined,
  );
}

function resolveMobilePackage(request) {
  return resolveFromPaths(request, [mobileNodeModules]);
}

function resolveNativeWindPackage(request) {
  try {
    return resolveFromPaths(request, [mobileNodeModules]);
  } catch {
    return resolveFromPaths(request, [workspaceNodeModules]);
  }
}

Module._resolveFilename = function (request, parent, isMain, options) {
  if (
    request === 'tailwindcss' ||
    request.startsWith('tailwindcss/') ||
    request === 'expo-router' ||
    request.startsWith('expo-router/') ||
    request === 'react-native-css-interop' ||
    request.startsWith('react-native-css-interop/')
  ) {
    return resolveMobilePackage(request);
  }

  if (request === 'nativewind' || request.startsWith('nativewind/')) {
    return resolveNativeWindPackage(request);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

Module._resolveFilename.__nexpoMobilePatched = true;
