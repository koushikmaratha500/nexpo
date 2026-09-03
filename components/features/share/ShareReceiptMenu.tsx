'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface ShareLink {
  id: string;
  url: string;
  expiresAt: string;
}

interface ShareReceiptMenuProps {
  transactionId: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function ShareReceiptMenu({
  transactionId,
  label = 'Share',
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: ShareReceiptMenuProps) {
  const { addToast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>([]);

  const loadLinks = async () => {
    const res = await axios.get<ShareLink[]>(`/api/user/transaction/${transactionId}/shares`);
    setLinks(res.data);
  };

  const openModal = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadLinks()
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, [open, transactionId]);

  const createLink = async () => {
    setLoading(true);
    try {
      const res = await axios.post<{ url: string; id: string; expiresAt: string }>(
        `/api/user/transaction/${transactionId}/share`,
        { expiresInDays: 7 },
      );
      const link = { id: res.data.id, url: res.data.url, expiresAt: res.data.expiresAt };
      setLinks((prev) => [link, ...prev]);
      await navigator.clipboard.writeText(res.data.url);
      addToast('Share link created and copied', 'success');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error || 'Failed to create share link'
        : 'Failed to create share link';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const revokeLink = async (shareId: string) => {
    setLoading(true);
    try {
      await axios.delete(`/api/user/shares/${shareId}`);
      setLinks((prev) => prev.filter((link) => link.id !== shareId));
      addToast('Share link revoked', 'success');
    } catch {
      addToast('Failed to revoke link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = (url: string) => {
    const text = `Receipt from PaysaSuchan: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {!hideTrigger ? (
        <Button variant="ghost" onClick={openModal} title="Share receipt">
          <span className="material-symbols-outlined text-[18px]">share</span>
          {label}
        </Button>
      ) : null}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Share receipt" subtitle="Public link expires in 7 days">
        <div className="flex flex-col gap-md">
          <Button onClick={createLink} disabled={loading} className="rounded-full">
            Create new link
          </Button>

          {loading && links.length === 0 ? (
            <p className="text-on-surface-variant font-body-md">Loading links...</p>
          ) : links.length === 0 ? (
            <p className="text-on-surface-variant font-body-md">No active share links yet.</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className="rounded-xl border border-outline-variant/40 p-md space-y-sm">
                <p className="font-mono-data text-mono-data break-all text-primary">{link.url}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Expires {new Date(link.expiresAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-sm">
                  <Button
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(link.url)}
                    className="rounded-full"
                  >
                    Copy
                  </Button>
                  <Button variant="secondary" onClick={() => shareWhatsApp(link.url)} className="rounded-full">
                    WhatsApp
                  </Button>
                  <Button variant="ghost" onClick={() => revokeLink(link.id)} className="rounded-full text-error">
                    Revoke
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
