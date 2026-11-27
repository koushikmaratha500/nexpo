import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { captureAssessSchema, captureRejectSchema, captureSaveSchema } from '../dtos/capture.dto';
import { CaptureService } from '../services/capture.service';

export class CaptureController extends BaseController {
  static async assess(req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => CaptureService.assess(userId, captureAssessSchema.parse(await req.json())),
      { fallbackMessage: 'Could not check these payments' },
    );
  }

  static async decisions(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const sinceRaw = searchParams.get('since');
      const since = sinceRaw ? new Date(sinceRaw) : null;
      return CaptureService.decisions(
        userId,
        since && !Number.isNaN(since.getTime()) ? since : null,
        searchParams.get('cursor'),
      );
    }, { fallbackMessage: 'Could not load decisions' });
  }

  static async reject(req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => CaptureService.reject(userId, captureRejectSchema.parse(await req.json())),
      { fallbackMessage: 'Could not save the decision' },
    );
  }

  static async save(req: NextRequest, userId: string) {
    return this.safeExecuteJson(
      async () => CaptureService.save(userId, captureSaveSchema.parse(await req.json()), this.requestMeta(req)),
      { status: 201, fallbackMessage: 'Failed to save the payment' },
    );
  }
}
