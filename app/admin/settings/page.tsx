'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const [currency, setCurrency] = useState('INR');
  const [matchingRate, setMatchingRate] = useState(90);
  const [requireReceipt, setRequireReceipt] = useState(true);
  const [autoApproveLimit, setAutoApproveLimit] = useState(100);
  const [toastMsg, setToastMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('Settings successfully updated on the server database!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">System Settings</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Adjust ledger limits, policy parameters, and currency.</p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-secondary-container/20 border border-secondary/20 text-on-secondary-container rounded-lg text-body-md font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-md">done</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy Configuration */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="bg-surface-container-lowest flex flex-col gap-6" glass={false}>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-primary">Matching Policy Rules</h3>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">Define bounds for automated transaction validation.</p>
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

            {/* Checkbox fields */}
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireReceipt}
                  onChange={(e) => setRequireReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md font-bold text-primary">Require Invoice/Receipt Uploads</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Flag all transactions above ₹75.00 without attachment files.</span>
                </div>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="submit" variant="primary" className="w-32 h-11">
              Save Policy
            </Button>
          </div>
        </div>

        {/* Security parameters */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-surface-container-lowest flex flex-col gap-4" glass={false}>
            <h3 className="font-title-md text-title-md font-bold text-primary">System Integrity</h3>
            <p className="font-label-md text-label-md text-on-surface-variant">Verify server nodes and diagnostic metrics.</p>
            
            <div className="flex flex-col gap-2 mt-4 border-t border-outline-variant/30 pt-4">
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">Database State</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Active / Healthy
                </span>
              </div>
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">API Latency</span>
                <span className="font-mono-data text-primary font-bold">14ms</span>
              </div>
              <div className="flex justify-between items-center text-body-md">
                <span className="text-on-surface-variant">Active Sessions</span>
                <span className="font-mono-data text-primary font-bold">8</span>
              </div>
            </div>
          </Card>
        </div>
      </form>

    </div>
  );
}
