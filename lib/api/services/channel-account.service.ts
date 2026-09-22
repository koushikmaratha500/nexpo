import { ChannelAccountRepository } from '../repositories/channel-account.repository';
import { toPrismaBotChannel } from '@/lib/bot/channel';
import type { ResolveUserRequest } from '../dtos/bot.dto';

export interface ResolveUserResult {
  linked: boolean;
  user_id?: string;
  status?: string;
  display_name?: string | null;
  link_message?: string;
}

export class ChannelAccountService {
  static async resolveUser(input: ResolveUserRequest): Promise<ResolveUserResult> {
    const channel = toPrismaBotChannel(input.channel);
    const devUserId = process.env.BOT_DEV_USER_ID?.trim();

    if (devUserId && process.env.NODE_ENV !== 'production') {
      await ChannelAccountRepository.upsertLinked({
        userId: devUserId,
        channel,
        externalUserId: input.external_user_id,
      });
      return { linked: true, user_id: devUserId, status: 'LINKED' };
    }

    const account = await ChannelAccountRepository.findByChannelAndExternalId(
      channel,
      input.external_user_id,
    );

    if (!account || account.status !== 'LINKED') {
      return {
        linked: false,
        status: account?.status ?? 'NOT_FOUND',
        link_message:
          'Link your WhatsApp in PaySaSuchan: open the app → Settings → Link WhatsApp.',
      };
    }

    await ChannelAccountRepository.touchLastSeen(account.id);

    return {
      linked: true,
      user_id: account.userId,
      status: account.status,
      display_name: account.displayName,
    };
  }

  static async resolveUserId(
    channel: string,
    externalUserId: string,
    inlineUserId?: string,
  ): Promise<string | null> {
    if (inlineUserId && process.env.BOT_ALLOW_INLINE_USER_ID === 'true') {
      return inlineUserId;
    }

    const result = await this.resolveUser({ channel: channel as 'whatsapp' | 'telegram', external_user_id: externalUserId });
    return result.linked ? result.user_id ?? null : null;
  }
}
