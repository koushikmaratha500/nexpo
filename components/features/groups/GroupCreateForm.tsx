'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface GroupCreateFormProps {
  onCreate: (payload: { name: string; description?: string }) => Promise<void>;
  onCancel?: () => void;
}

export function GroupCreateForm({ onCreate, onCancel }: GroupCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="font-label-md text-on-surface font-bold uppercase">Group Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Flatmates, Trip to Goa, Office Lunch..."
          className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label-md text-on-surface font-bold uppercase">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional context for this shared ledger"
          className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface resize-y"
        />
      </div>
      {errorMsg && <p className="text-error text-body-md">{errorMsg}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </form>
  );
}
