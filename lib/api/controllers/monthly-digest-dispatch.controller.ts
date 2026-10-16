import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { monthlyDigestDispatchSchema, monthlyDigestPreviewSchema } from '../dtos/monthly-digest.dto';
import { MonthlyDigestDispatchService } from '../services/monthly-digest-dispatch.service';

export class MonthlyDigestDispatchController extends BaseController {
  static async dispatch(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = monthlyDigestDispatchSchema.parse(await req.json());
      return MonthlyDigestDispatchService.dispatch(body);
    }, { fallbackMessage: 'Failed to run monthly digest dispatch' });
  }

  static async preview(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = monthlyDigestPreviewSchema.parse(await req.json());
      return MonthlyDigestDispatchService.previewForUser(body.userId, body.period);
    }, { fallbackMessage: 'Failed to preview monthly digest' });
  }
}
