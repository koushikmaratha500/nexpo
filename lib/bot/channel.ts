import type { BotChannel } from '@prisma/client';

export function toPrismaBotChannel(channel: string): BotChannel {
  const normalized = channel.toLowerCase();
  if (normalized === 'whatsapp') return 'WHATSAPP';
  if (normalized === 'telegram') return 'TELEGRAM';
  if (normalized === 'sms') return 'SMS';
  throw new Error(`Unsupported bot channel: ${channel}`);
}

export function fromPrismaBotChannel(channel: BotChannel): 'whatsapp' | 'telegram' | 'sms' {
  if (channel === 'WHATSAPP') return 'whatsapp';
  if (channel === 'TELEGRAM') return 'telegram';
  return 'sms';
}
