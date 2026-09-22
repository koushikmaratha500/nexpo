import { NextRequest } from 'next/server';
import { verifyTinesBridgeAuth } from '@/lib/webhooks/tinesBridgeAuth';
import { handleApiError, HttpError } from '@/lib/api/middleware/errorHandler';
import { TinesBridgeController } from '@/lib/api/controllers/tines-bridge.controller';

/**
 * Ingress from Tines after OpenWA webhook + AI parse.
 * Auth: Authorization: Bearer <TINES_BRIDGE_SECRET>
 *
 * Processes AI parse results, saves transactions via BotCommandService,
 * and returns reply_text for Tines to send back via OpenWA send-text.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TINES_BRIDGE_SECRET?.trim();
    if (!secret) {
      throw new HttpError(503, 'TINES_BRIDGE_SECRET is not configured');
    }

    if (!verifyTinesBridgeAuth(req.headers.get('authorization'), secret)) {
      throw new HttpError(401, 'Unauthorized');
    }

    return await TinesBridgeController.ingest(req);
  } catch (error) {
    return handleApiError(error);
  }
}
