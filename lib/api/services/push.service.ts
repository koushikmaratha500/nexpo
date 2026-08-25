export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

export class PushService {
  private static getConfig() {
    return {
      appId: process.env.ONESIGNAL_APP_ID?.trim() || '',
      apiKey: process.env.ONESIGNAL_REST_API_KEY?.trim() || '',
    };
  }

  static isConfigured(): boolean {
    const { appId, apiKey } = this.getConfig();
    return Boolean(appId && apiKey);
  }

  static async send(userIds: string[], payload: PushPayload): Promise<{ sent: number; skipped: boolean }> {
    const { appId, apiKey } = this.getConfig();
    if (!appId || !apiKey || userIds.length === 0) {
      return { sent: 0, skipped: true };
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: userIds,
        headings: { en: payload.title },
        contents: { en: payload.body },
        url: payload.url,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneSignal request failed: ${errorText || response.statusText}`);
    }

    return { sent: userIds.length, skipped: false };
  }
}
