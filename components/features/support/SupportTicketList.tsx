'use client';

import React from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SupportStatusBadge } from './SupportStatusBadge';

export interface SupportTicketListItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketListProps {
  tickets: SupportTicketListItem[];
  isLoading?: boolean;
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

export function SupportTicketList({ tickets, isLoading = false }: SupportTicketListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-on-surface-variant font-medium">
        Loading support tickets...
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="py-12 text-center text-on-surface-variant font-medium">
        No support tickets found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono-data text-[12px] text-on-surface-variant whitespace-nowrap">
                {formatDateTime(ticket.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-body-md font-bold text-primary">{ticket.name}</span>
                  <span className="font-label-md text-on-surface-variant">{ticket.email}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate text-on-surface-variant">{ticket.message}</p>
              </TableCell>
              <TableCell>
                <SupportStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell align="right">
                <Link
                  href={`/admin/support/${ticket.id}`}
                  className="text-primary font-bold hover:underline text-label-md"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
