'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  profileImageUrl: string | null;
  country: { name: string; isoCode: string } | null;
  currency: { code: string; symbol: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalExpenses: number;
  totalBudgets: number;
  expenseCount: number;
  budgetCount: number;
  sessionCount: number;
}

interface ExpenseItem {
  id: string;
  title: string;
  description: string | null;
  amount: string | number;
  transactionDate: string;
  status: string;
  merchant: string | null;
  notes: string | null;
  documentUrl: string | null;
  documentFileName: string | null;
  category: { name: string; code: string; id: string } | null;
  paymentType: { name: string; id: string } | null;
  currency: { code: string; symbol: string } | null;
  user: { firstName: string; lastName: string | null; email: string | null } | null;
}

interface AuditItem {
  id: string;
  action: string;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  createdAt: string;
  transaction?: { id: string; title: string; merchant: string | null; amount: string | number; type: string } | null;
}

function formatMoney(amount: string | number, symbol = '₹'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function mapStatus(status: string): 'ACTIVE' | 'BLOCKED' | 'PENDING' {
  switch (status) {
    case 'A': return 'ACTIVE';
    case 'B': return 'BLOCKED';
    case 'P': return 'PENDING';
    default: return 'PENDING';
  }
}

function mapStatusToPrisma(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'A';
    case 'BLOCKED': return 'B';
    case 'PENDING': return 'P';
    default: return 'A';
  }
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // Loaded state
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'logs'>('overview');

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BLOCKED' | 'PENDING'>('ACTIVE');

  // Fetch user data, stats, expenses, and audit logs
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [detailRes, expensesRes, auditRes] = await Promise.all([
          axios.get(`/api/admin/user/${id}`),
          axios.get(`/api/admin/user/${id}/expenses?page=1&pageSize=100`),
          axios.get(`/api/admin/user/${id}/auditlogs?page=1&pageSize=50`),
        ]);

        if (!isMounted) return;

        setUser(detailRes.data.user);
        setStats(detailRes.data.stats);
        setExpenses(expensesRes.data.items || []);
        setAuditLogs(auditRes.data.items || []);
      } catch (err: any) {
        if (!isMounted) return;
        const errMsg = err.response?.data?.error || 'Failed to load user details';
        setLoadError(errMsg);
        addToast(errMsg, 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, addToast]);

  // Initialize edit form when opening Edit Modal
  const handleOpenEdit = () => {
    if (!user) return;
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName || '');
    setEditStatus(mapStatus(user.status));
    setIsEditOpen(true);
  };

  // Save edit changes via API
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const response = await axios.patch(`/api/admin/user/${user.id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        status: mapStatusToPrisma(editStatus),
      });

      if (response.data) {
        setUser(prev => prev ? { ...prev, firstName: editFirstName, lastName: editLastName, status: mapStatusToPrisma(editStatus) } : prev);
        addToast('Customer updated successfully', 'success');
        setIsEditOpen(false);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update customer';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status via API
  const toggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === 'B' ? 'A' : 'B';
    const displayStatus = user.status === 'B' ? 'ACTIVE' : 'BLOCKED';

    try {
      await axios.patch(`/api/admin/user/${user.id}`, {
        status: nextStatus,
      });

      setUser(prev => prev ? { ...prev, status: nextStatus } : prev);
      addToast(`Customer ${displayStatus === 'BLOCKED' ? 'blocked' : 'unblocked'}`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update customer status';
      addToast(errMsg, 'error');
    }
  };

  // Confirm delete user via API
  const handleConfirmDelete = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const response = await axios.delete(`/api/admin/user/${user.id}`);
      if (response.data?.success) {
        addToast('Customer deleted successfully', 'success');
        setIsDeleteOpen(false);
        router.push('/admin/users');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to delete customer';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expense modal detail triggers
  const handleViewExpense = (exp: ExpenseItem) => {
    setSelectedExpense(exp);
    setIsPreviewLoading(true);
    setIsExpenseDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="w-full py-xl flex flex-col items-center justify-center gap-md">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="font-label-md text-label-md text-on-surface-variant font-bold">Loading User Dossier...</span>
      </div>
    );
  }

  if (loadError && !user) {
    return (
      <div className="w-full max-w-xl mx-auto py-3xl text-center flex flex-col items-center gap-lg animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-error-container/20 flex items-center justify-center text-error">
          <span className="material-symbols-outlined text-[48px]">person_off</span>
        </div>
        <div>
          <h2 className="font-headline-lg text-headline-lg font-black text-primary">User Dossier Not Found</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">{loadError}</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/users')} className="px-6 py-3">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to User List</span>
        </Button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userFullName = `${user.firstName} ${user.lastName || ''}`.trim();
  const displayStatus = mapStatus(user.status);
  const totalSpent = Number(stats?.totalExpenses || 0);
  const expenseCount = stats?.expenseCount || 0;
  const pendingCount = expenses.filter(e => e.status === 'P').length;
  const countryName = user.country?.name || 'N/A';
  const currencySymbol = user.currency?.symbol || '₹';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Back Link Breadcrumb */}
      <div>
        <button
          onClick={() => router.push('/admin/users')}
          className="group flex items-center gap-sm text-on-surface-variant hover:text-primary transition-colors font-title-md text-title-md font-semibold"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Back to User Management</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-surface-container-lowest p-lg" glass={false}>
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-lg">
          
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-md text-center sm:text-left">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={userFullName}
                className="w-24 h-24 rounded-full border-2 border-outline-variant object-cover shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container font-black flex items-center justify-center text-3xl shadow-sm">
                {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
              </div>
            )}
            <div className="flex flex-col gap-xs">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-sm">
                <h1 className="font-headline-lg text-headline-lg font-black text-primary tracking-tight">
                  {userFullName}
                </h1>
                <span className="px-2 py-0.5 rounded-md font-label-md text-[10px] font-bold bg-surface-variant text-on-surface-variant">
                  CUSTOMER
                </span>
                <span className={`px-2 py-0.5 rounded-full font-label-md text-[10px] font-bold ${
                  displayStatus === 'ACTIVE'
                    ? 'bg-secondary-container/20 text-on-secondary-container'
                    : displayStatus === 'PENDING'
                    ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                    : 'bg-error-container/20 text-error'
                }`}>
                  {displayStatus}
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant font-mono-data">{user.email}</p>
              <p className="font-label-md text-label-md text-on-surface-variant/70 mt-1 flex items-center justify-center sm:justify-start gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                Member since: {formatDate(user.createdAt)}
              </p>
              {user.mobile && (
                <p className="font-label-md text-label-md text-on-surface-variant/70 flex items-center justify-center sm:justify-start gap-1">
                  <span className="material-symbols-outlined text-xs">phone</span>
                  {user.mobile}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex flex-row flex-wrap justify-center gap-sm">
            <Button variant="secondary" onClick={handleOpenEdit} className="px-3 py-2">
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="secondary"
              onClick={toggleStatus}
              className={`px-3 py-2 ${displayStatus === 'BLOCKED' ? 'hover:bg-secondary-container/20 hover:text-secondary' : 'hover:bg-error-container/20 hover:text-error'}`}
            >
              <span className="material-symbols-outlined text-sm">
                {displayStatus === 'BLOCKED' ? 'lock_open' : 'lock'}
              </span>
              <span>{displayStatus === 'BLOCKED' ? 'Unblock' : 'Block'}</span>
            </Button>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(true)} className="px-3 py-2 text-error hover:bg-error-container/10">
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Delete Account</span>
            </Button>
          </div>

        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        
        {/* Total Spent */}
        <Card className="bg-surface-container-lowest p-md border-l-4 border-primary flex items-center justify-between" glass={false}>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Total Expenditures</p>
            <h3 className="font-headline-md text-headline-md text-primary font-black mt-sm">
              {formatMoney(totalSpent, currencySymbol)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
        </Card>

        {/* Transactions Count */}
        <Card className="bg-surface-container-lowest p-md border-l-4 border-outline-variant flex items-center justify-between" glass={false}>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Submissions Logged</p>
            <h3 className="font-headline-md text-headline-md text-primary font-black mt-sm">
              {expenseCount} transactions
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
        </Card>

        {/* Pending Verification */}
        <Card className={`bg-surface-container-lowest p-md border-l-4 flex items-center justify-between ${pendingCount > 0 ? 'border-secondary' : 'border-outline-variant/50'}`} glass={false}>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Awaiting Verification</p>
            <h3 className={`font-headline-md text-headline-md font-black mt-sm ${pendingCount > 0 ? 'text-secondary' : 'text-primary'}`}>
              {pendingCount} records
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: pendingCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>pending_actions</span>
          </div>
        </Card>

      </div>

      {/* Tabs and Tab Details Layout */}
      <div className="flex flex-col gap-md">
        
        {/* Tab Headers */}
        <div className="flex border-b border-outline-variant/50 gap-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-md font-title-md text-title-md font-semibold transition-all relative ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-md font-title-md text-title-md font-semibold transition-all relative ${
              activeTab === 'expenses'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Expenses Log ({expenseCount})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-md font-title-md text-title-md font-semibold transition-all relative ${
              activeTab === 'logs'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Activity Trail
          </button>
        </div>

        {/* Tab Content render panels */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <Card className="bg-surface-container-lowest p-lg" glass={false}>
              <h3 className="font-headline-sm text-headline-sm text-primary font-black mb-lg">Identity Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">System ID</span>
                  <span className="font-mono-data text-primary text-body-lg">{user.id}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Email Address</span>
                  <span className="text-primary text-body-lg">{user.email || '—'}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Mobile</span>
                  <span className="text-primary text-body-lg">{user.mobile || '—'}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">First Name</span>
                  <span className="text-primary text-body-lg font-semibold">{user.firstName}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Last Name</span>
                  <span className="text-primary text-body-lg font-semibold">{user.lastName || '—'}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Access Role</span>
                  <div>
                    <span className="px-2 py-0.5 rounded-md font-label-md text-xs font-bold bg-surface-variant text-on-surface-variant">
                      CUSTOMER
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Verification State</span>
                  <div>
                    <span className={`px-2 py-1 rounded-full font-label-md text-xs font-bold ${
                      displayStatus === 'ACTIVE'
                        ? 'bg-secondary-container/20 text-on-secondary-container'
                        : displayStatus === 'PENDING'
                        ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                        : 'bg-error-container/20 text-error'
                    }`}>
                      {displayStatus}
                      {user.emailVerified ? ' • Email Verified' : ' • Email Unverified'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Country/Region</span>
                  <span className="text-primary text-body-lg font-medium">{countryName}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Currency</span>
                  <span className="text-primary text-body-lg font-medium">{user.currency ? `${user.currency.code} (${user.currency.symbol})` : '—'}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Account Created</span>
                  <span className="text-primary text-body-lg font-medium">{formatDateTime(user.createdAt)}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Last Updated</span>
                  <span className="text-primary text-body-lg font-medium">{formatDateTime(user.updatedAt)}</span>
                </div>
                {stats && (
                  <div className="flex flex-col gap-xs">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Session Count</span>
                    <span className="text-primary text-body-lg font-medium">{stats.sessionCount} sessions</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Expenses Log Tab Content */}
          {activeTab === 'expenses' && (
            <>
              {expenses.length === 0 ? (
                <Card className="bg-surface-container-lowest p-lg text-center" glass={false}>
                  <div className="py-xl flex flex-col items-center gap-md">
                    <span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>
                    <h3 className="font-title-md text-title-md font-bold text-primary">No Expense Records</h3>
                    <p className="text-body-md text-on-surface-variant max-w-sm">This user hasn't submitted any corporate expenditures yet.</p>
                  </div>
                </Card>
              ) : (
                <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
                  <div className="w-full overflow-x-auto scrollbar-hide">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead align="right">Amount</TableHead>
                          <TableHead align="center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-primary font-bold">{(exp.title || exp.merchant || 'Expense').slice(0, 20)}{(exp.title || exp.merchant || '').length > 20 ? '...' : ''}</span>
                                <span className="text-[11px] text-on-surface-variant truncate max-w-[150px]">{exp.description || ''}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {exp.category ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface">
                                  {exp.category.name}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-variant text-on-surface-variant">
                                  Uncategorized
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono-data text-xs">{formatDate(exp.transactionDate)}</TableCell>
                            <TableCell className="text-xs text-on-surface-variant">{exp.paymentType?.name || '—'}</TableCell>
                            <TableCell align="right" className="font-bold text-primary text-sm">
                              {formatMoney(exp.amount, exp.currency?.symbol || '₹')}
                            </TableCell>
                            <TableCell align="center">
                              <button
                                onClick={() => handleViewExpense(exp)}
                                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Activity Trail Tab Content */}
          {activeTab === 'logs' && (
            <Card className="bg-surface-container-lowest p-lg" glass={false}>
              <h3 className="font-headline-sm text-headline-sm text-primary font-black mb-lg">Recent User Activities</h3>
              {auditLogs.length === 0 ? (
                <div className="py-xl flex flex-col items-center gap-md">
                  <span className="material-symbols-outlined text-[48px] text-outline">fact_check</span>
                  <h3 className="font-title-md text-title-md font-bold text-primary">No Activity Logs</h3>
                  <p className="text-body-md text-on-surface-variant max-w-sm">No audit trail entries found for this user.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-outline-variant/60 flex flex-col gap-lg">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Node Dot */}
                      <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-white border-4 border-primary shadow-sm" />
                      
                      <div className="flex items-start gap-md">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {log.action.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-primary font-bold text-sm">{log.action}</span>
                          <span className="text-xs text-on-surface-variant">
                            {log.transaction ? `Transaction: ${log.transaction.title || log.transaction.merchant || 'Record'}` : ''}
                          </span>
                          <span className="text-xs text-on-surface-variant/70">
                            {log.ipAddress ? `IP: ${log.ipAddress}` : 'System action'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-on-surface-variant/80 font-mono-data sm:text-right">{formatDateTime(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>

      </div>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify User Account" customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Modify User Account</h2>
          </div>
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => setIsEditOpen(false)}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <form onSubmit={handleSaveEdit} className="p-lg flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">First Name</label>
              <input
                type="text"
                required
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Last Name</label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Verification Status</label>
            <div className="relative">
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-outline-variant/30 pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex items-center gap-2" 
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting ? 'Saving...' : 'Save Alterations'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User" customHeader={true} cardPadding="p-0" maxWidth="max-w-md">
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Remove User?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            This action cannot be undone. Are you sure you want to remove this user from the ledger network?
          </p>
        </div>
        
        <div className="mx-xl my-lg p-md bg-surface-container rounded-lg border border-outline-variant flex items-center gap-md">
          <div className="flex-grow min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold text-left">Selected Account</p>
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{userFullName}</p>
            <p className="font-label-md text-[10px] text-on-surface-variant font-mono-data text-left">{user.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Role</p>
            <p className="font-body-md text-body-md text-error font-bold">CUSTOMER</p>
          </div>
        </div>

        <div className="p-lg bg-surface-container-low flex flex-col-reverse sm:flex-row gap-md sm:justify-end border-t border-outline-variant">
          <button className="px-xl h-11 flex items-center justify-center rounded-lg border border-outline text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold" onClick={() => setIsDeleteOpen(false)}>
            Keep
          </button>
          <button 
            disabled={isSubmitting}
            className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleConfirmDelete}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Removing...' : 'Remove Account'}
          </button>
        </div>
      </Modal>

      {/* Expense View Details Modal */}
      <Modal isOpen={isExpenseDetailsOpen} onClose={() => setIsExpenseDetailsOpen(false)} title="Expense Ledger Entry" customHeader={true} cardPadding="p-0" maxWidth="max-w-4xl">
        {selectedExpense && (
          <>
            <div className="px-xl py-lg border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>receipt</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Expense Ledger Entry</h2>
              </div>
              <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => setIsExpenseDetailsOpen(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            
            <div className="p-xl grid grid-cols-1 md:grid-cols-5 gap-xl overflow-y-auto max-h-[calc(85vh-160px)]">
              <div className="md:col-span-3 flex flex-col gap-lg">
                <div className="flex justify-between items-start border-b border-outline-variant/30 pb-md">
                  <div>
                    <h3 className="font-headline-md text-headline-md font-black text-primary">{selectedExpense.title || selectedExpense.merchant || 'Expense'}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{selectedExpense.description || 'No description provided'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold block mb-1">Total Amount</span>
                    <span className="font-headline-md text-headline-md font-black text-primary">
                      {formatMoney(selectedExpense.amount, selectedExpense.currency?.symbol || '₹')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-md bg-surface-container/30 p-md rounded-lg border border-outline-variant/40">
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Transaction Date</span>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">{formatDate(selectedExpense.transactionDate)}</p>
                  </div>
                  <div className="space-y-xs">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Payment Type</span>
                    <div className="flex items-center gap-xs text-on-surface font-body-md text-body-md font-semibold">
                      <span className="material-symbols-outlined text-outline text-[18px]">
                        {selectedExpense.paymentType?.name === 'Credit Card' || selectedExpense.paymentType?.name === 'Debit Card' ? 'credit_card' : selectedExpense.paymentType?.name === 'Cash' ? 'payments' : 'account_balance'}
                      </span>
                      <span>{selectedExpense.paymentType?.name || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-xs p-md bg-surface-container-low rounded-lg border border-outline-variant">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Internal Notes</span>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    {selectedExpense.notes || 'No purpose notes provided for this ledger entry.'}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-md">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Receipt Preview</span>
                {selectedExpense.documentUrl && selectedExpense.documentFileName ? (
                  <>
                    <div 
                      onClick={() => window.open(selectedExpense.documentUrl || '', '_blank')}
                      className="group relative aspect-[3/4] w-full bg-surface-container rounded-lg border border-outline-variant overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
                    >
                      {isPreviewLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-high/60 backdrop-blur-[2px] z-10 gap-sm animate-pulse">
                          <div className="w-12 h-12 rounded bg-surface-container-highest flex items-center justify-center mb-1">
                            <span className="material-symbols-outlined text-xl text-on-surface-variant">description</span>
                          </div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-bold">Rendering Document...</span>
                        </div>
                      )}
                      {selectedExpense.documentFileName.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={`${selectedExpense.documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-full border-none pointer-events-none"
                          onLoad={() => setIsPreviewLoading(false)}
                        />
                      ) : (
                        <img 
                          src={selectedExpense.documentUrl} 
                          alt={selectedExpense.documentFileName} 
                          className="w-full h-full object-cover pointer-events-none" 
                          onLoad={() => setIsPreviewLoading(false)}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                        <div className="bg-surface-container-lowest text-on-surface px-md py-sm rounded-lg flex items-center gap-sm font-label-md font-semibold">
                          <span className="material-symbols-outlined">zoom_in</span>
                          View Full Size
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm p-sm bg-surface-bright border border-outline-variant rounded-lg">
                      <span className="material-symbols-outlined text-on-primary-container">file_present</span>
                      <div className="flex-grow min-w-0">
                        <p className="font-label-md text-on-surface truncate font-semibold">{selectedExpense.documentFileName}</p>
                      </div>
                      <a
                        href={selectedExpense.documentUrl}
                        download={selectedExpense.documentFileName}
                        className="p-xs hover:bg-surface-container-high rounded transition-colors text-on-surface-variant flex items-center justify-center"
                        title="Download receipt"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[3/4] w-full bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant select-none p-md text-center">
                    <span className="material-symbols-outlined text-[48px] text-outline mb-sm">no_photography</span>
                    <p className="font-title-md text-title-md font-semibold">No Receipt Scan</p>
                    <p className="font-label-md text-label-md mt-xs">No scan file has been attached.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-xl py-lg bg-surface-bright border-t border-outline-variant flex justify-end items-center">
              <button className="px-xl py-2 font-title-md text-title-md border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high active:scale-95 transition-all font-semibold" onClick={() => setIsExpenseDetailsOpen(false)}>
                Close Details
              </button>
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}