'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface APIAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  status: string; // Prisma: A, D, B, I, P
  createdAt: string;
  updatedAt: string;
}

interface SessionInfo {
  id: string;
  jwt: string;
  loginTime: string;
  logoutTime: string | null;
  expiryTime: string;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
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

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminManagementPage() {
  const { addToast } = useToast();
  const [admins, setAdmins] = useState<APIAdmin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<APIAdmin | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleItemsPerPageChange = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<'basic' | 'session'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // Forms state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BLOCKED' | 'PENDING'>('ACTIVE');

  // Create Admin form state
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  // Overview data
  const [adminSessions, setAdminSessions] = useState<SessionInfo[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);

  // Fetch admins from API
  const fetchAdmins = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/adminstrators?page=1&pageSize=1000`);
      if (response.data) {
        setAdmins(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
      addToast('Failed to load administrators', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAdmins(currentPage);
  }, [currentPage, fetchAdmins]);

  // Fetch admin overview (sessions)
  const fetchAdminOverview = useCallback(async (adminId: string) => {
    setIsOverviewLoading(true);
    try {
      const response = await axios.get(`/api/admin/administrator/${adminId}/overview`);
      if (response.data) {
        setAdminSessions(response.data.recentSessions || []);
        setActiveSessions(response.data.activeSessions || 0);
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      addToast('Failed to load session history', 'error');
    } finally {
      setIsOverviewLoading(false);
    }
  }, [addToast]);

  // Open Edit Dialog
  const handleOpenEdit = (admin: APIAdmin) => {
    setSelectedAdmin(admin);
    setEditFirstName(admin.firstName);
    setEditLastName(admin.lastName || '');
    setEditStatus(mapStatus(admin.status));
    setIsEditOpen(true);
  };

  // Save Edit Dialog via API
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setIsSubmitting(true);

    try {
      await axios.patch(`/api/admin/administrator/${selectedAdmin.id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        status: mapStatusToPrisma(editStatus),
      });

      addToast('Administrator updated successfully', 'success');
      setIsEditOpen(false);
      fetchAdmins(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update administrator';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle admin status via API (Block/Unblock)
  const toggleStatus = async (admin: APIAdmin) => {
    const nextStatus = admin.status === 'B' ? 'A' : 'B';
    const displayStatus = admin.status === 'B' ? 'ACTIVE' : 'BLOCKED';

    try {
      await axios.patch(`/api/admin/administrator/${admin.id}`, {
        status: nextStatus,
      });

      addToast(`Administrator ${displayStatus === 'BLOCKED' ? 'blocked' : 'unblocked'}`, 'success');
      fetchAdmins(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update administrator status';
      addToast(errMsg, 'error');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (admin: APIAdmin) => {
    setSelectedAdmin(admin);
    setIsDeleteOpen(true);
  };

  // Confirm Delete via API
  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);

    try {
      const response = await axios.delete(`/api/admin/administrator/${selectedAdmin.id}`);
      if (response.data?.success) {
        addToast('Administrator deleted successfully', 'success');
        setSelectedAdmin(null);
        setIsDeleteOpen(false);
        fetchAdmins(currentPage);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to delete administrator';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new admin via API
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await axios.post('/api/admin/adminstrators', {
        firstName: createFirstName,
        lastName: createLastName || null,
        email: createEmail,
        password: createPassword,
      });

      if (response.data) {
        addToast('Administrator created successfully', 'success');
        setCreateFirstName('');
        setCreateLastName('');
        setCreateEmail('');
        setCreatePassword('');
        fetchAdmins(currentPage);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to create administrator';
      addToast(errMsg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Open Admin Details Modal
  const handleOpenAdminDetails = (admin: APIAdmin) => {
    setSelectedAdmin(admin);
    setAdminModalTab('basic');
    setIsAdminDetailsOpen(true);
    fetchAdminOverview(admin.id);
  };

  // Client-side pagination
  const totalItems = admins.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = admins.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Admins List Container */}
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Administrator Hub</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Manage system administrators and inspect login sessions.</p>
          </div>
          <Button 
            variant="primary" 
            className="px-4 py-2"
            onClick={() => {
              setCreateFirstName('');
              setCreateLastName('');
              setCreateEmail('');
              setCreatePassword('');
              setIsEditOpen(true);
              // Switch to create mode by using a special flag
              setSelectedAdmin(null);
            }}
          >
            <span className="material-symbols-outlined text-sm">shield_person</span>
            <span>Add Admin</span>
          </Button>
        </div>

        {/* Table Card */}
        <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
          {isLoading ? (
            <div className="w-full py-xl flex flex-col items-center justify-center gap-md">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">Loading Administrators...</span>
            </div>
          ) : (
          <div className="w-full overflow-x-auto scrollbar-hide">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator Profile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdmins.map((u) => {
                const displayStatus = mapStatus(u.status);
                return (
                  <TableRow 
                    key={u.id} 
                    onClick={() => handleOpenAdminDetails(u)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-xs">
                          {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">{u.firstName} {u.lastName || ''}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono-data">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md font-label-md text-[10px] font-bold bg-primary text-on-primary">
                        ADMIN
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${
                        displayStatus === 'ACTIVE' 
                          ? 'bg-secondary-container/20 text-on-secondary-container'
                          : displayStatus === 'PENDING'
                          ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {displayStatus}
                      </span>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(u)}
                          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all"
                          title="Edit Admin"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => toggleStatus(u)}
                          className={`p-1 hover:bg-surface-container rounded-full transition-all ${
                            u.status === 'B' ? 'text-secondary hover:text-secondary' : 'text-on-surface-variant hover:text-error'
                          }`}
                          title={u.status === 'B' ? 'Unblock Admin' : 'Block Admin'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {u.status === 'B' ? 'lock_open' : 'lock'}
                          </span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(u)}
                          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all"
                          title="Delete Admin"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant italic">
                    No administrators found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
          )}

          {/* Pagination Footer */}
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </Card>
      </div>

      {/* Edit/Create Admin Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedAdmin(null); }} title={selectedAdmin ? "Modify Admin Account" : "Create New Administrator"} customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{selectedAdmin ? 'Modify Admin Account' : 'Create New Administrator'}</h2>
          </div>
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => { setIsEditOpen(false); setSelectedAdmin(null); }}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <form onSubmit={selectedAdmin ? handleSaveEdit : handleCreateAdmin} className="p-lg flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">First Name</label>
              <input
                type="text"
                required
                value={selectedAdmin ? editFirstName : createFirstName}
                onChange={(e) => selectedAdmin ? setEditFirstName(e.target.value) : setCreateFirstName(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Last Name</label>
              <input
                type="text"
                value={selectedAdmin ? editLastName : createLastName}
                onChange={(e) => selectedAdmin ? setEditLastName(e.target.value) : setCreateLastName(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>
          </div>

          {/* Only show email/password for create mode */}
          {!selectedAdmin && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Only show status for edit mode */}
          {selectedAdmin && (
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
          )}

          <div className="flex gap-2 justify-end border-t border-outline-variant/30 pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsEditOpen(false); setSelectedAdmin(null); }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex items-center gap-2" 
              disabled={isSubmitting || isCreating}
            >
              {(isSubmitting || isCreating) && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting || isCreating ? 'Saving...' : (selectedAdmin ? 'Save Alterations' : 'Create Administrator')}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Admin" customHeader={true} cardPadding="p-0" maxWidth="max-w-md">
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Remove Admin?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            This action cannot be undone. Are you sure you want to remove this administrator account?
          </p>
        </div>
        
        <div className="mx-xl my-lg p-md bg-surface-container rounded-lg border border-outline-variant flex items-center gap-md">
          <div className="flex-grow min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold text-left">Selected Account</p>
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{selectedAdmin?.firstName} {selectedAdmin?.lastName || ''}</p>
            <p className="font-label-md text-[10px] text-on-surface-variant font-mono-data text-left">{selectedAdmin?.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Role</p>
            <p className="font-body-md text-body-md text-error font-bold">ADMIN</p>
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
            {isSubmitting ? 'Removing...' : 'Remove Admin'}
          </button>
        </div>
      </Modal>

      {/* Admin Details Modal */}
      <Modal isOpen={isAdminDetailsOpen} onClose={() => setIsAdminDetailsOpen(false)} title="Admin Profile Details" customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        {selectedAdmin && (
          <>
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Admin Profile Details</h2>
              </div>
              <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => setIsAdminDetailsOpen(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="p-lg bg-surface-container/30 border-b border-outline-variant/30 flex items-center gap-md">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container font-black flex items-center justify-center text-xl shadow-sm">
                {(selectedAdmin.firstName?.[0] || '') + (selectedAdmin.lastName?.[0] || '')}
              </div>
              <div className="flex flex-col gap-xs">
                <h3 className="font-headline-sm text-headline-sm text-primary font-black">
                  {selectedAdmin.firstName} {selectedAdmin.lastName || ''}
                </h3>
                <span className="text-xs text-on-surface-variant font-mono-data">{selectedAdmin.email}</span>
              </div>
            </div>

            <div className="px-lg pt-md flex border-b border-outline-variant/30 gap-md bg-surface-container-lowest">
              <button
                onClick={() => setAdminModalTab('basic')}
                className={`pb-sm font-title-md text-title-md font-semibold transition-all relative ${
                  adminModalTab === 'basic'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setAdminModalTab('session')}
                className={`pb-sm font-title-md text-title-md font-semibold transition-all relative ${
                  adminModalTab === 'session'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Login History
              </button>
            </div>

            <div className="p-lg">
              {adminModalTab === 'basic' && (
                <div className="grid grid-cols-2 gap-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">System ID</span>
                    <span className="font-mono-data text-primary text-sm font-semibold">{selectedAdmin.id}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Verification State</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full font-label-md text-[10px] font-bold ${
                        mapStatus(selectedAdmin.status) === 'ACTIVE'
                          ? 'bg-secondary-container/20 text-on-secondary-container'
                          : mapStatus(selectedAdmin.status) === 'PENDING'
                          ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {mapStatus(selectedAdmin.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/20 pt-md mt-sm">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Access Level</span>
                    <span className="text-primary text-sm font-medium">ADMIN (System Administrator)</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/20 pt-md mt-sm">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Account Created</span>
                    <span className="text-primary text-sm font-medium">{formatDateTime(selectedAdmin.createdAt)}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/20 pt-md mt-sm">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Last Updated</span>
                    <span className="text-primary text-sm font-medium">{formatDateTime(selectedAdmin.updatedAt)}</span>
                  </div>
                </div>
              )}

              {adminModalTab === 'session' && (
                <div className="flex flex-col gap-lg">
                  {isOverviewLoading ? (
                    <div className="flex items-center justify-center py-xl gap-md">
                      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <span className="font-label-md text-label-md text-on-surface-variant font-bold">Loading Sessions...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-sm p-sm bg-surface-container rounded-lg border border-outline-variant">
                        <span className="material-symbols-outlined text-secondary">circle</span>
                        <div>
                          <span className="font-label-md text-label-md text-on-surface-variant font-bold">Active Sessions</span>
                          <span className="font-body-md text-body-md text-primary font-black">{activeSessions}</span>
                        </div>
                      </div>

                      {adminSessions.length === 0 ? (
                        <div className="py-md text-center text-on-surface-variant italic">
                          No login sessions recorded.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-sm">
                          {adminSessions.map((session) => (
                            <div key={session.id} className="p-sm bg-surface-container-low rounded-lg border border-outline-variant flex flex-col gap-xs">
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded-full font-label-md text-[10px] font-bold ${
                                  session.status === 'A' ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-error-container/20 text-error'
                                }`}>
                                  {session.status === 'A' ? 'ACTIVE' : 'ENDED'}
                                </span>
                                <span className="font-label-md text-[10px] text-on-surface-variant/70 font-mono-data">
                                  {formatDateTime(session.loginTime)}
                                </span>
                              </div>
                              <span className="font-label-md text-label-md text-on-surface-variant/80 truncate">
                                {session.userAgent || 'Unknown device'}
                              </span>
                              {session.ipAddress && (
                                <span className="font-mono-data text-[10px] text-on-surface-variant/60">
                                  IP: {session.ipAddress}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="px-lg py-md bg-surface-bright border-t border-outline-variant flex justify-end gap-sm">
              <Button variant="secondary" onClick={() => setIsAdminDetailsOpen(false)}>
                Close Details
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsAdminDetailsOpen(false);
                  if (selectedAdmin) handleOpenEdit(selectedAdmin);
                }}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Modify Account</span>
              </Button>
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}
