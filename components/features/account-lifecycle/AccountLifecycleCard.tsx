'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthContext';
import { AccountLifecycleTermsAcceptance } from '@/components/features/account-lifecycle/AccountLifecycleTermsAcceptance';

type LifecycleStatus = {
  mode: 'ACTIVE' | 'RESET_PENDING' | 'DELETE_PENDING';
  requested_at: string | null;
  purge_at: string | null;
  days_remaining: number | null;
  can_restore: boolean;
};

type OtpChannel = 'email' | 'sms';
type ModalAction = 'RESET' | 'DELETE';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export function AccountLifecycleCard() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [lifecycle, setLifecycle] = useState<LifecycleStatus | null>(null);
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [loading, setLoading] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const [otp, setOtp] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await axios.get<{ success: boolean; lifecycle: LifecycleStatus }>(
        '/api/user/account/lifecycle',
      );
      setLifecycle(response.data.lifecycle);
    } catch {
      setLifecycle(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openOtpFlow = async (action: ModalAction) => {
    setLoading(true);
    setModalError(null);
    try {
      await axios.post('/api/user/account/otp/send', { action, channel });
      if (action === 'RESET') {
        addToast(
          `Reset OTP sent to your ${channel === 'email' ? 'email' : 'phone'}. Enter it below to continue.`,
          'success',
        );
      } else {
        addToast(
          `Account deletion OTP sent to your ${channel === 'email' ? 'email' : 'phone'}. Enter it below to continue.`,
          'success',
        );
      }
      setOtp('');
      setTermsAccepted(false);
      setModalAction(action);
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to send verification code'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!termsAccepted) {
      setModalError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!modalAction || otp.length !== 6) {
      setModalError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setModalError(null);
    try {
      if (modalAction === 'RESET') {
        await axios.post('/api/user/account/reset', {
          confirmation: 'RESET',
          channel,
          otp,
        });
        setModalAction(null);
        setOtp('');
        addToast('Account reset complete. Personal transactions are hidden for now.', 'success');
        await load();
      } else {
        await axios.post('/api/user/account/delete', {
          confirmation: 'DELETE',
          channel,
          otp,
        });
        setModalAction(null);
        setOtp('');
        addToast('Account scheduled for deletion. Signing you out…', 'info');
        await logout();
      }
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const restoreAccount = async () => {
    setLoading(true);
    try {
      await axios.post('/api/user/account/restore');
      addToast('Account restored successfully.', 'success');
      await load();
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Restore failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!lifecycle) {
    return null;
  }

  const modalTitle =
    modalAction === 'DELETE' ? 'Confirm account deletion' : 'Confirm account reset';
  const modalSubtitle =
    modalAction === 'DELETE'
      ? 'Enter the deletion code we sent to complete this step.'
      : 'Enter the reset code we sent to complete this step.';

  return (
    <>
      <Card className="bg-surface-container-lowest p-5 flex flex-col gap-4" glass={false}>
        <div>
          <h3 className="font-title-md text-title-md font-bold text-primary">Account data</h3>
          <p className="font-body-md text-on-surface-variant mt-1">
            Reset or delete requires a one-time code by email or SMS. Data is retained for 7 days, then
            permanently removed.
          </p>
        </div>

        {lifecycle.mode !== 'ACTIVE' ? (
          <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-3 text-sm text-on-surface-variant">
            {lifecycle.mode === 'RESET_PENDING'
              ? 'Reset in progress — personal transactions are hidden.'
              : 'Account scheduled for deletion.'}
            {lifecycle.purge_at ? (
              <p className="mt-1">
                Recovery available until {new Date(lifecycle.purge_at).toLocaleString()}
                {lifecycle.days_remaining !== null ? ` (${lifecycle.days_remaining} day(s) left)` : ''}.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={channel === 'email' ? 'primary' : 'secondary'}
            onClick={() => setChannel('email')}
            type="button"
            disabled={Boolean(modalAction)}
          >
            Email OTP
          </Button>
          <Button
            variant={channel === 'sms' ? 'primary' : 'secondary'}
            onClick={() => setChannel('sms')}
            type="button"
            disabled={Boolean(modalAction)}
          >
            SMS OTP
          </Button>
        </div>

        {lifecycle.can_restore ? (
          <Button variant="secondary" disabled={loading || Boolean(modalAction)} onClick={restoreAccount}>
            Restore account &amp; transactions
          </Button>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            disabled={loading || Boolean(modalAction)}
            onClick={() => openOtpFlow('RESET')}
            className="flex-1"
          >
            Reset account
          </Button>
          <Button
            variant="secondary"
            disabled={loading || Boolean(modalAction)}
            onClick={() => openOtpFlow('DELETE')}
            className="flex-1"
          >
            Delete account
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={modalAction !== null}
        onClose={() => undefined}
        title={modalTitle}
        subtitle={modalSubtitle}
        dismissible={false}
        closeOnEscape={false}
        showCloseButton={false}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 pt-2">
          <input
            className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-3 font-body-md text-on-surface text-center tracking-[0.35em]"
            placeholder="******"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            autoFocus
          />
          <AccountLifecycleTermsAcceptance
            checked={termsAccepted}
            onChange={setTermsAccepted}
            disabled={loading}
          />
          {modalError ? (
            <p className="font-label-sm text-label-sm text-error text-center">{modalError}</p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            onClick={() => void submitOtp()}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? 'Verifying…'
              : modalAction === 'DELETE'
                ? 'Verify and delete account'
                : 'Verify and reset account'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
