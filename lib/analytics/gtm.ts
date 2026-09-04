const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export function getGoogleTagManagerId(): string | null {
  const configured = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!configured || !GTM_ID_PATTERN.test(configured)) {
    return null;
  }
  return configured;
}
