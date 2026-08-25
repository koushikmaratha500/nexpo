'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

type ReminderChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP';

interface SystemSettings {
  baseCurrency: string;
  matchingRate: number;
  requireReceipt: boolean;
  autoApproveLimit: number;
  notifications: {
    pushEnabled: boolean;
    emailRemindersEnabled: boolean;
    inAppEnabled: boolean;
    defaultChannels: ReminderChannel[];
  };
  resendEnabled: boolean;
}

const CHANNEL_OPTIONS: Array<{ value: ReminderChannel; label: string }> = [
  { value: 'IN_APP', label: 'In-app' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PUSH', label: 'Push' },
];

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const hasLoadedRef = useRef(false);

  const [currency, setCurrency] = useState('INR');
  const [matchingRate, setMatchingRate] = useState(90);
  const [requireReceipt, setRequireReceipt] = useState(true);
  const [autoApproveLimit, setAutoApproveLimit] = useState(100);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [defaultChannels, setDefaultChannels] = useState<ReminderChannel[]>(['IN_APP']);
  const [resendEnabled, setResendEnabled] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadSettings() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const response = await axios.get<SystemSettings>('/api/admin/settings');
        const data = response.data;
        setCurrency(data.baseCurrency);
        setMatchingRate(data.matchingRate);
        setRequireReceipt(data.requireReceipt);
        setAutoApproveLimit(data.autoApproveLimit);
        setPushEnabled(data.notifications.pushEnabled);
        setEmailRemindersEnabled(data.notifications.emailRemindersEnabled);
        setInAppEnabled(data.notifications.inAppEnabled);
        setDefaultChannels(data.notifications.defaultChannels);
        setResendEnabled(data.resendEnabled);
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : 'Failed to load system settings';
        setErrorMsg(msg);
        addToast(msg, 'error');
        hasLoadedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [addToast]);

  const toggleDefaultChannel = (channel: ReminderChannel) => {
    setDefaultChannels((current) => {
      if (current.includes(channel)) {
        const next = current.filter((item) => item !== channel);
        return next.length > 0 ? next : current;
      }
      return [...current, channel];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await axios.patch<SystemSettings>('/api/admin/settings', {
        baseCurrency: currency,
        matchingRate,
        requireReceipt,
        autoApproveLimit,
        notifications: {
          pushEnabled,
          emailRemindersEnabled,
          inAppEnabled,
          defaultChannels,
        },
      });

      const data = response.data;
      setCurrency(data.baseCurrency);
      setMatchingRate(data.matchingRate);
      setRequireReceipt(data.requireReceipt);
      setAutoApproveLimit(data.autoApproveLimit);
      setPushEnabled(data.notifications.pushEnabled);
      setEmailRemindersEnabled(data.notifications.emailRemindersEnabled);
      setInAppEnabled(data.notifications.inAppEnabled);
      setDefaultChannels(data.notifications.defaultChannels);
      setResendEnabled(data.resendEnabled);
      addToast('Settings saved successfully.', 'success');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save settings';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-on-surface-variant font-medium">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">System Settings</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
            Adjust ledger limits, policy parameters, currency, and global notification policy.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="bg-surface-container-lowest flex flex-col gap-6" glass={false}>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-primary">Matching Policy Rules</h3>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                Define bounds for automated transaction validation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface w-full font-bold"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Verification Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={matchingRate}
                    onChange={(e) => setMatchingRate(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono-data text-mono-data font-bold text-primary w-12 text-right">{matchingRate}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-bold uppercase">Auto-Approve Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-data text-on-surface-variant">₹</span>
                  <input
                    type="number"
                    value={autoApproveLimit}
                    onChange={(e) => setAutoApproveLimit(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary text-on-surface font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-outline-variant/50 my-2"></div>

            <label className="flex items-center gap-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireReceipt}
                onChange={(e) => setRequireReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-bold text-primary">Require Invoice/Receipt Uploads</span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Flag all transactions above ₹75.00 without attachment files.
                </span>
              </div>
            </label>
          </Card>

          <Card className="bg-surface-container-lowest flex flex-col gap-6" glass={false}>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-primary">Notification Policy</h3>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                Global switches for reminders and customer notifications. Customer preferences cannot override disabled channels.
              </p>
            </div>

            {!resendEnabled && (
              <div className="p-4 bg-tertiary-container/20 border border-tertiary/20 text-on-tertiary-container rounded-lg text-body-md">
                OTP and auth emails are simulated because <code className="font-mono-data">ENABLE_RESEND=false</code>.
                Reminder email dispatch is disabled at the infrastructure level until Resend is enabled.
              </div>
            )}

            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inAppEnabled}
                  onChange={(e) => setInAppEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body-md font-bold text-primary">In-app notifications</span>
                  <span className="font-label-md text-on-surface-variant">Allow in-app inbox delivery for reminders and alerts.</span>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailRemindersEnabled}
                  onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body-md font-bold text-primary">Email reminders</span>
                  <span className="font-label-md text-on-surface-variant">
                    Allow reminder emails when Resend is enabled and customers opt in.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body-md font-bold text-primary">Push notifications</span>
                  <span className="font-label-md text-on-surface-variant">Allow OneSignal push delivery when users subscribe.</span>
                </div>
              </label>
            </div>

            <div>
              <p className="font-label-md text-on-surface font-bold uppercase mb-3">Default reminder channels</p>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((option) => {
                  const selected = defaultChannels.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleDefaultChannel(option.value)}
                      className={`px-3 py-1.5 rounded-full text-label-md font-bold transition-colors ${
                        selected
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              variant="primary"
              className="w-36 h-11 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
            <h3 className="font-title-md text-title-md font-bold text-primary">Delivery Status</h3>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Infrastructure flags that affect whether outbound channels can actually send.
            </p>

            <div className="flex flex-col gap-2 mt-2 border-t border-outline-variant/30 pt-4">
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">Resend email service</span>
                <span className={`font-bold ${resendEnabled ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {resendEnabled ? 'Enabled' : 'Simulated'}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">In-app channel</span>
                <span className={`font-bold ${inAppEnabled ? 'text-secondary' : 'text-error'}`}>
                  {inAppEnabled ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">Email reminders</span>
                <span className={`font-bold ${emailRemindersEnabled && resendEnabled ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {emailRemindersEnabled && resendEnabled ? 'Allowed' : 'Blocked'}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">Push channel</span>
                <span className={`font-bold ${pushEnabled ? 'text-secondary' : 'text-error'}`}>
                  {pushEnabled ? 'Allowed' : 'Disabled'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
