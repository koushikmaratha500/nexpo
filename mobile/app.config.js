const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function firstDefined(...values) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

const mobileEnv = parseEnvFile(path.join(projectRoot, '.env'));
const rootEnv = parseEnvFile(path.join(projectRoot, '..', '.env.local'));

const apiUrl = firstDefined(
  mobileEnv.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_API_URL,
  mobileEnv.NEXT_PUBLIC_APP_URL,
  rootEnv.EXPO_PUBLIC_API_URL,
  rootEnv.NEXT_PUBLIC_APP_URL,
);

const supabaseUrl = firstDefined(
  mobileEnv.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  mobileEnv.NEXT_PUBLIC_SUPABASE_URL,
  rootEnv.EXPO_PUBLIC_SUPABASE_URL,
);

const supabasePublishableKey = firstDefined(
  mobileEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  mobileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  rootEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

if (apiUrl) {
  process.env.EXPO_PUBLIC_API_URL = apiUrl;
}
if (supabaseUrl) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl;
}
if (supabasePublishableKey) {
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey;
}

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      supabaseUrl,
      supabasePublishableKey,
    },
  },
};
