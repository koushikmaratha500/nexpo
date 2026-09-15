import { NextRequest } from 'next/server';
import { BillingController } from '@/lib/api/controllers/billing.controller';
import { handleApiError } from '@/lib/api/middleware/errorHandler';
import { PaymentProvider } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    return await BillingController.handleWebhook(req, PaymentProvider.RAZORPAY);
  } catch (error) {
    return handleApiError(error);
  }
}
