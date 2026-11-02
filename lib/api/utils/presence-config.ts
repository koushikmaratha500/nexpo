/** Opt-in live presence (Redis TTL heartbeats). Default off — set ENABLE_PRESENCE=true to activate. */
export function isPresenceEnabled(): boolean {
  const flag = process.env.ENABLE_PRESENCE?.trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
}

/** How long a heartbeat keeps the user marked online (seconds). */
export const PRESENCE_TTL_SECONDS = Number.parseInt(
  process.env.PRESENCE_TTL_SECONDS || '90',
  10,
);

/** Suggested client heartbeat interval (seconds). */
export const PRESENCE_HEARTBEAT_INTERVAL_SECONDS = Number.parseInt(
  process.env.PRESENCE_HEARTBEAT_INTERVAL_SECONDS || '60',
  10,
);

export function presenceKeyForUser(userId: string): string {
  return `nexpo:presence:v1:${userId}`;
}
