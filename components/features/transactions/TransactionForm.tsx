'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { dateToInputFormat } from '@/lib/date';
import { useForm } from 'react-hook-form';

export interface TransactionFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<{
    type: 'DEBIT' | 'CREDIT';
    title: string;
    merchant: string;
    category: string;
    amount: number;
    date: string;
    currency: string;
    paymentType: string;
    notes: string;
    depositType: string;
  }>;
  onSubmitSuccess?: () => void;
  transactionId?: string;
}

interface FormValues {
  type: 'DEBIT' | 'CREDIT';
  title: string;
  merchant: string;
  category: string;
  amount: string;
  date: string;
  currency: string;
  paymentType: string;
  notes: string;
  depositType: string;
}

const inputClassName =
  'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function TransactionForm({
  mode = 'create',
  initialData,
  onSubmitSuccess,
  transactionId,
}: TransactionFormProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTransaction, updateTransaction } = useTransactions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: initialData?.type || 'DEBIT',
      title: initialData?.title || '',
      merchant: initialData?.merchant || '',
      category: initialData?.category || '',
      amount: initialData?.amount ? String(initialData.amount) : '',
      date: initialData?.date || dateToInputFormat(new Date()),
      currency: initialData?.currency || 'INR',
      paymentType: initialData?.paymentType || '',
      notes: initialData?.notes || '',
      depositType: initialData?.depositType || '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setIsSubmitting(true);
      try {
        if (mode === 'edit' && transactionId) {
          await updateTransaction(transactionId, data);
        } else {
          await createTransaction(data);
        }
        addToast(`Transaction ${mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');
        onSubmitSuccess?.();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } }; message?: string };
        addToast(e.response?.data?.error || e.message || 'Failed to save transaction', 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, transactionId, createTransaction, updateTransaction, addToast, onSubmitSuccess],
  );

  const getTypeLabel = (type: 'DEBIT' | 'CREDIT'): string => {
    return type === 'DEBIT' ? 'Expense' : 'Income';
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" value="DEBIT" {...register('type')} defaultChecked={initialData?.type === 'DEBIT'} />
            {getTypeLabel('DEBIT')}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="CREDIT" {...register('type')} defaultChecked={initialData?.type === 'CREDIT'} />
            {getTypeLabel('CREDIT')}
          </label>
        </div>

        <div>
          <input
            {...register('title', { required: 'Title is required' })}
            className={inputClassName}
            placeholder="Title"
          />
          {errors.title && <span className="text-error text-body-sm">{errors.title.message}</span>}
        </div>

        <div>
          <input
            {...register('merchant')}
            className={inputClassName}
            placeholder="Merchant"
          />
        </div>

        <div>
          <input
            {...register('amount', { required: 'Amount is required', valueAsNumber: true })}
            type="number"
            step="0.01"
            className={inputClassName}
            placeholder="Amount"
          />
          {errors.amount && <span className="text-error text-body-sm">{errors.amount.message}</span>}
        </div>

        <div>
          <input
            {...register('date', { required: 'Date is required' })}
            type="date"
            className={inputClassName}
          />
          {errors.date && <span className="text-error text-body-sm">{errors.date.message}</span>}
        </div>

        <div>
          <textarea
            {...register('notes')}
            className={inputClassName}
            placeholder="Notes (optional)"
            rows={3}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {mode === 'edit' ? 'Update' : 'Create'} Transaction
        </Button>
      </form>
    </Card>
  );
}
