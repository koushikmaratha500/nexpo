'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { 
  MOCK_MONTHLY_GROWTH, 
  MOCK_SPEND_DISTRIBUTION, 
  MOCK_ACTIVITY_LOGS 
} from '@/mock/data';

export default function AdminDashboard() {
  const [selectedTrend, setSelectedTrend] = useState('Yearly');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Administrative Overview</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Real-time governance and expenditure metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="px-4 py-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Last 30 Days</span>
          </Button>
          <Button variant="primary" className="px-4 py-2">
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-fixed text-on-primary-fixed rounded-lg">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span className="text-secondary font-label-md text-label-md font-bold">+4.2%</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Total Users</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">1,240</h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <span className="text-secondary font-label-md text-label-md font-bold">79% rate</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Active Users</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">980</h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-secondary font-label-md text-label-md font-bold">Stable</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Global Expenses</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">₹450,200</h3>
        </Card>

        <Card className="bg-surface-container-lowest" glass={false}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-on-error-container rounded-lg">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="text-error font-label-md text-label-md font-bold">+2 new</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Pending Approvals</p>
          <h3 className="font-headline-md text-headline-md text-primary font-black mt-1">14</h3>
        </Card>
      </div>

      {/* Main Charts & Bento Sections */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Growth (Bar Chart Mockup) */}
        <Card className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-lowest flex flex-col gap-6" glass={false}>
          <div>
            <h4 className="font-title-md text-title-md font-bold text-primary">Monthly Ledger Flow</h4>
            <p className="font-label-md text-on-surface-variant">Global aggregate spending flow trends</p>
          </div>

          <div className="flex-1 min-h-[200px] flex items-end justify-between px-2 pb-2 select-none border-b border-outline-variant/30">
            {MOCK_MONTHLY_GROWTH.map((item) => {
              const maxVal = Math.max(...MOCK_MONTHLY_GROWTH.map(m => m.value), 100);
              const heightPct = `${(item.value / maxVal) * 100}%`;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full px-2 h-full flex items-end">
                    <div 
                      style={{ height: heightPct }} 
                      className="w-full rounded-t-sm transition-all duration-300 bg-primary hover:bg-primary/95 cursor-pointer relative group"
                    >
                      {/* Tooltip on Hover */}
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                        ₹{item.value}k
                      </span>
                    </div>
                  </div>
                  <span className="font-label-md text-[10px] sm:text-label-md text-on-surface-variant font-bold">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Global Distribution Map Mockup */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-primary text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          {/* Decorative graphic details */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <h4 className="font-title-md text-title-md font-bold">Expense Distribution</h4>
              <p className="font-label-md text-label-md opacity-70 mt-1">Global regional heat signature</p>
            </div>
            
            <div className="space-y-md">
              {MOCK_SPEND_DISTRIBUTION.map((region) => (
                <div key={region.region} className="space-y-xs">
                  <div className="flex justify-between items-center text-body-md">
                    <span>{region.region}</span>
                    <span className="font-mono-data text-mono-data font-bold">
                      ₹{(region.amount / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${region.percentage}%` }}
                      className="bg-secondary-container h-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="w-full py-2 bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 mt-4">
              View Detailed Map
            </Button>
          </div>
          
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[160px]">public</span>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="col-span-12">
          <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-white/40">
              <h4 className="font-title-md text-title-md text-primary font-bold">Recent Activity Log</h4>
              <Button variant="ghost" className="text-primary font-label-md text-label-md py-1">
                View All Actions
              </Button>
            </div>
            
            <div className="w-full overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Action Taken</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead align="right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ACTIVITY_LOGS.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${log.avatarBg} flex items-center justify-center text-xs font-bold shadow-sm`}>
                          {log.avatarInitials}
                        </div>
                        <span className="font-body-md text-body-md font-bold text-primary">{log.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full font-label-md text-label-md font-bold ${
                        log.action === 'Approved Batch'
                          ? 'bg-secondary-container/20 text-secondary'
                          : log.action === 'Modified Role'
                          ? 'bg-primary-fixed/30 text-primary'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-medium">
                      {log.entity}
                    </TableCell>
                    <TableCell align="right" className="text-on-surface-variant font-mono-data text-mono-data">
                      {log.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
