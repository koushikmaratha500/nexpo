'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthContext';

type LifecycleStatus = {
  mode: 'ACTIVE' | 'RESET_PENDING' | 'DELETE_PENDING';
  requested_at: string | null;
  purge_at: string | null;
  days_remaining: number | null;
  can_restore: boolean;
};

type OtpChannel = 'email' | 'sms';
type PendingAction = 'RESET' | 'DELETE' | null;

export function AccountLifecycleCard() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [lifecycle, setLifecycle] = useState<LifecycleStatus | null>(null);
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [otp, setOtp] = useState('');
  const [otpSentFor, setOtpSentFor] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);

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

  const sendOtp = async (action: 'RESET' | 'DELETE') => {
    setLoading(true);
    try {
      await axios.post('/api/user/account/otp/send', { action, channel });
      setOtpSentFor(action);
      addToast(`Verification code sent via ${channel === 'email' ? 'email' : 'SMS'}`, 'success');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Failed to send code';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAccount = async () => {
    if (otpSentFor !== 'RESET' || otp.length !== 6) {
      addToast('Send and enter the email or SMS verification code first', 'error');
      return;
    }
    if (!window.confirm('Reset all personal transactions? You can recover them within 7 days by signing in again.')) {
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/user/account/reset', {
        confirmation: 'RESET',
        channel,
        otp,
      });
      addToast('Account reset started. Personal transactions are hidden for now.', 'success');
      setOtp('');
      setOtpSentFor(null);
      await load();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Reset failed';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (otpSentFor !== 'DELETE' || otp.length !== 6) {
      addToast('Send and enter the email or SMS verification code first', 'error');
      return;
    }
    if (
      !window.confirm(
        'Delete your account? Sign in within 7 days to cancel deletion. After that, all data is permanently removed.',
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/user/account/delete', {
        confirmation: 'DELETE',
        channel,
        otp,
      });
      addToast('Account scheduled for deletion. You have been signed out.', 'info');
      await logout();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : err instanceof Error
            ? err.message
            : 'Delete failed';
      addToast(message, 'error');
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
      addToast(err instanceof Error ? err.message : 'Restore failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!lifecycle) {
    return null;
  }

  return (
    <Card className="bg-surface-container-lowest p-5 flex flex-col gap-4" glass={false}>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-primary">Account data</h3>
        <p className="font-body-md text-on-surface-variant mt-1">
          Reset or delete requires a one-time code by email or SMS. Data is retained for 7 days, then permanently removed.
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
        >
          Email OTP
        </Button>
        <Button
          variant={channel === 'sms' ? 'primary' : 'secondary'}
          onClick={() => setChannel('sms')}
          type="button"
        >
          SMS OTP
        </Button>
      </div>

      <input
        className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-3 font-body-md text-on-surface"
        placeholder="6-digit verification code"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />

      {lifecycle.can_restore ? (
        <Button variant="secondary" disabled={loading} onClick={restoreAccount}>
          Restore account &amp; transactions
        </Button>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" disabled={loading} onClick={() => sendOtp('RESET')} className="flex-1">
            Send code (reset)
          </Button>
          <Button variant="secondary" disabled={loading} onClick={resetAccount} className="flex-1">
            Reset account
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" disabled={loading} onClick={() => sendOtp('DELETE')} className="flex-1">
            Send code (delete)
          </Button>
          <Button variant="secondary" disabled={loading} onClick={deleteAccount} className="flex-1">
            Delete account
          </Button>
        </div>
      </div>
    </Card>
  );
}
