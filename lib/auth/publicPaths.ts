/** Routes reachable without a Nexpo JWT (marketing, legal, auth flows, share links). */
const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/faq',
  '/pricing',
  '/privacy-policy',
  '/terms-and-conditions',
  '/terms-of-use',
]);

export function isPublicAppPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/r/')) return true;
  return false;
}
