'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SupportStatusBadge } from './SupportStatusBadge';

export interface SupportTicketDetailData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  adminNotes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketDetailProps {
  ticket: SupportTicketDetailData;
  adminNotes: string;
  onAdminNotesChange: (value: string) => void;
  onSave: () => void;
  onCloseTicket: () => void;
  onReopenTicket: () => void;
  onDelete: () => void;
  isSaving?: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportTicketDetail({
  ticket,
  adminNotes,
  onAdminNotesChange,
  onSave,
  onCloseTicket,
  onReopenTicket,
  onDelete,
  isSaving = false,
}: SupportTicketDetailProps) {
  const isClosed = ticket.status === 'I';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-title-md text-title-md font-bold text-primary">Customer Request</h3>
              <p className="font-label-md text-on-surface-variant mt-1">
                Submitted {formatDateTime(ticket.createdAt)}
              </p>
            </div>
            <SupportStatusBadge status={ticket.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-label-md text-on-surface-variant uppercase font-bold">Name</p>
              <p className="font-body-md text-primary font-bold">{ticket.name}</p>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant uppercase font-bold">Email</p>
              <p className="font-body-md text-primary">{ticket.email}</p>
            </div>
            {ticket.phone && (
              <div>
                <p className="font-label-md text-on-surface-variant uppercase font-bold">Phone</p>
                <p className="font-body-md text-primary">{ticket.phone}</p>
              </div>
            )}
          </div>

          <div>
            <p className="font-label-md text-on-surface-variant uppercase font-bold mb-2">Message</p>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4 text-body-md text-on-surface whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>

          {ticket.fileUrl && (
            <div>
              <p className="font-label-md text-on-surface-variant uppercase font-bold mb-2">Attachment</p>
              <a
                href={ticket.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                {ticket.fileName || 'View attachment'}
              </a>
            </div>
          )}
        </Card>

        <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
          <div>
            <h3 className="font-title-md text-title-md font-bold text-primary">Admin Notes</h3>
            <p className="font-label-md text-on-surface-variant mt-1">Internal triage notes visible to administrators only.</p>
          </div>
          <textarea
            value={adminNotes}
            onChange={(e) => onAdminNotesChange(e.target.value)}
            rows={6}
            placeholder="Add triage notes, resolution steps, or follow-up actions..."
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface resize-y"
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
          <h3 className="font-title-md text-title-md font-bold text-primary">Triage Actions</h3>
          <p className="font-label-md text-on-surface-variant">Update ticket lifecycle for this request.</p>

          <div className="flex flex-col gap-2">
            {isClosed ? (
              <Button type="button" variant="secondary" onClick={onReopenTicket} disabled={isSaving}>
                Reopen Ticket
              </Button>
            ) : (
              <Button type="button" onClick={onCloseTicket} disabled={isSaving}>
                Mark as Closed
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onDelete} disabled={isSaving}>
              Soft Delete
            </Button>
          </div>

          <div className="border-t border-outline-variant/30 pt-4 text-label-md text-on-surface-variant space-y-2">
            <div className="flex justify-between">
              <span>Ticket ID</span>
              <span className="font-mono-data text-primary">{ticket.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span>{formatDateTime(ticket.updatedAt)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
