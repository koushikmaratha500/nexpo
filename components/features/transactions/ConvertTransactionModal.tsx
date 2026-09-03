'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface GroupOption {
  id: string;
  name: string;
}

interface ConvertTransactionModalProps {
  transactionId: string;
  mode: 'personal-to-group' | 'group-to-personal';
  onConverted?: () => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function ConvertTransactionModal({
  transactionId,
  mode,
  onConverted,
  className,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: ConvertTransactionModalProps) {
  const { addToast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || mode !== 'personal-to-group') return;
    void axios.get<{ items: GroupOption[] }>('/api/user/groups').then((res) => {
      setGroups(res.data.items || []);
      if (res.data.items?.[0]) setGroupId(res.data.items[0].id);
    });
  }, [open, mode]);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const payload =
        mode === 'personal-to-group'
          ? { target: 'group', groupId }
          : { target: 'personal' };
      await axios.post(`/api/user/transaction/${transactionId}/convert`, payload);
      addToast(
        mode === 'personal-to-group'
          ? 'Moved to group ledger'
          : 'Moved to personal ledger',
        'success',
      );
      setOpen(false);
      onConverted?.();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error || 'Conversion failed'
        : 'Conversion failed';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'personal-to-group' ? 'Move to group' : 'Move to personal ledger';
  const subtitle =
    mode === 'personal-to-group'
      ? 'This creates a group expense with an equal split and removes the personal entry.'
      : 'This removes group splits and creates a personal transaction. The group entry is deleted.';

  return (
    <>
      {!hideTrigger ? (
        <Button variant="secondary" className={className} onClick={() => setOpen(true)}>
          {title}
        </Button>
      ) : null}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle}>
        {mode === 'personal-to-group' ? (
          <label className="flex flex-col gap-1 mb-md">
            <span className="font-label-md font-bold text-on-surface-variant">Target group</span>
            <select
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex gap-sm justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading || (mode === 'personal-to-group' && !groupId)}>
            {loading ? 'Moving...' : 'Confirm move'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
