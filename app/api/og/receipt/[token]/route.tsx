import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { TransactionShareService } from '@/lib/api/services/transaction-share.service';
import { BRAND_NAME } from '@/lib/brand/constants';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, segmentData: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await segmentData.params;
    const data = await TransactionShareService.getPublicReceipt(token);
    const { receipt } = data;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4338ca 100%)',
            color: 'white',
            padding: 48,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              PS
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{BRAND_NAME}</div>
          </div>
          <div style={{ fontSize: 20, opacity: 0.8, marginBottom: 8 }}>Receipt</div>
          <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 12 }}>
            {receipt.merchant || receipt.title}
          </div>
          <div style={{ fontSize: 56, fontWeight: 900 }}>{receipt.amountFormatted}</div>
          <div style={{ marginTop: 16, fontSize: 22, opacity: 0.85 }}>
            {new Date(receipt.transactionDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          {receipt.category ? (
            <div style={{ marginTop: 24, fontSize: 20, opacity: 0.75 }}>{receipt.category}</div>
          ) : null}
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#7c3aed',
            color: 'white',
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          Receipt unavailable
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }
}
