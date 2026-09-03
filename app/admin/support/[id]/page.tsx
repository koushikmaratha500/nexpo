'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { SupportTicketDetail, type SupportTicketDetailData } from '@/components/features/support';
import { useToast } from '@/hooks/useToast';

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const ticketId = params.id;

  const [ticket, setTicket] = useState<SupportTicketDetailData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/support/${ticketId}`);
      const data = response.data as SupportTicketDetailData;
      setTicket(data);
      setAdminNotes(data.adminNotes || '');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to load support ticket';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const updateTicket = async (payload: { status?: string; adminNotes?: string | null }) => {
    if (!ticketId) return;
    setIsSaving(true);
    try {
      const response = await axios.patch(`/api/admin/support/${ticketId}`, payload);
      const data = response.data as SupportTicketDetailData;
      setTicket(data);
      setAdminNotes(data.adminNotes || '');
      addToast('Support ticket updated.', 'success');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to update support ticket';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = () => updateTicket({ adminNotes });
  const handleCloseTicket = () => updateTicket({ status: 'I', adminNotes });
  const handleReopenTicket = () => updateTicket({ status: 'A', adminNotes });

  const handleDelete = async () => {
    if (!ticketId) return;
    if (!window.confirm('Soft-delete this support ticket?')) return;

    setIsSaving(true);
    try {
      await axios.delete(`/api/admin/support/${ticketId}`);
      addToast('Support ticket deleted.', 'success');
      router.push('/admin/support');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to delete support ticket';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-on-surface-variant font-medium">
        Loading support ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-4">
        <p className="text-on-surface-variant font-medium">Support ticket not found.</p>
        <Link href="/admin/support">
          <Button variant="secondary">Back to inbox</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <Link href="/admin/support" className="text-primary font-bold hover:underline text-label-md">
            ← Back to inbox
          </Link>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight mt-2">
            Ticket Detail
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            {ticket.name} · {ticket.email}
          </p>
        </div>
      </div>

      <SupportTicketDetail
        ticket={ticket}
        adminNotes={adminNotes}
        onAdminNotesChange={setAdminNotes}
        onSave={handleSaveNotes}
        onCloseTicket={handleCloseTicket}
        onReopenTicket={handleReopenTicket}
        onDelete={handleDelete}
        isSaving={isSaving}
      />
    </div>
  );
}
