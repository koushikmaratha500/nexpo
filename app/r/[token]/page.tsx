import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/brand/constants';
import { TransactionShareService } from '@/lib/api/services/transaction-share.service';
import { PublicReceiptView } from '@/components/features/share/PublicReceiptView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  try {
    const data = await TransactionShareService.getPublicReceipt(token);
    const title = data.receipt.merchant || data.receipt.title;
    const amount = data.receipt.amountFormatted;

    return {
      title: `${title} — ${BRAND_NAME} Receipt`,
      description: `${amount} · Shared via ${BRAND_NAME}`,
      openGraph: {
        title: `${title} — ${amount}`,
        description: `Receipt shared via ${BRAND_NAME}`,
        images: [`/api/og/receipt/${token}`],
      },
    };
  } catch {
    return {
      title: `Receipt — ${BRAND_NAME}`,
      description: 'Shared receipt',
    };
  }
}

export default async function PublicReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicReceiptView token={token} />;
}
