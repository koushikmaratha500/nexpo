const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(username));
}

export function assertValidUsername(username: string): string {
  const normalized = normalizeUsername(username);
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error('Username must be 3-30 characters and use letters, numbers, or underscores only');
  }
  return normalized;
}
