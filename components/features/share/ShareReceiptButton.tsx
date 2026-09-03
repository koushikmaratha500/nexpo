'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface ShareReceiptButtonProps {
  transactionId: string;
  label?: string;
}

export function ShareReceiptButton({ transactionId, label = 'Share' }: ShareReceiptButtonProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await axios.post<{ url: string; expiresAt: string }>(
        `/api/user/transaction/${transactionId}/share`,
        { expiresInDays: 7 },
      );
      const { url } = res.data;
      const text = `Receipt from PaysaSuchan: ${url}`;

      if (navigator.share) {
        await navigator.share({ title: 'PaysaSuchan Receipt', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        addToast('Share link copied to clipboard', 'success');
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: string })?.error || 'Failed to create share link'
        : 'Failed to create share link';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" onClick={handleShare} disabled={loading} title="Share receipt">
      <span className="material-symbols-outlined text-[18px]">share</span>
      {label}
    </Button>
  );
}
