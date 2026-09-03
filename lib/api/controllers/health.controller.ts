import { NextResponse } from 'next/server';
import { BaseController, getErrorMessage } from './base.controller';
import { HealthService } from '../services/health.service';

export class HealthController extends BaseController {
  static async check() {
    try {
      const report = await HealthService.check();
      return NextResponse.json(report, {
        status: report.status === 'down' ? 503 : 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'down',
          checkedAt: new Date().toISOString(),
          checks: [],
          error: getErrorMessage(error, 'Health check failed'),
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }
}
