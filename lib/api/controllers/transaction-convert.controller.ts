import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { TransactionConvertService } from '../services/transaction-convert.service';
import { convertTransactionSchema } from '../dtos/transaction-convert.dto';

export class TransactionConvertController extends BaseController {
  static async convert(req: NextRequest, transactionId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = convertTransactionSchema.parse(body);
      const meta = this.requestMeta(req);
      return TransactionConvertService.convert(userId, transactionId, validated, meta);
    }, { fallbackMessage: 'Failed to convert transaction' });
  }
}
