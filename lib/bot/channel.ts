import type { BotChannel } from '@prisma/client';

export function toPrismaBotChannel(channel: string): BotChannel {
  const normalized = channel.toLowerCase();
  if (normalized === 'whatsapp') return 'WHATSAPP';
  if (normalized === 'telegram') return 'TELEGRAM';
  throw new Error(`Unsupported bot channel: ${channel}`);
}

export function fromPrismaBotChannel(channel: BotChannel): 'whatsapp' | 'telegram' {
  return channel === 'WHATSAPP' ? 'whatsapp' : 'telegram';
}
