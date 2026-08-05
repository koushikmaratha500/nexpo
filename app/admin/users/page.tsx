'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface APIUser {
  id: string;
  email: string | null;
  mobile: string | null;
  firstName: string;
  lastName: string | null;
  profileImageUrl: string | null;
  status: string;
  country: { name: string } | null;
  currency: { code: string } | null;
  createdAt: string;
  updatedAt: string;
}

// Map Prisma status to display status
function mapStatus(status: string): 'ACTIVE' | 'BLOCKED' | 'PENDING' {
  switch (status) {
    case 'A': return 'ACTIVE';
    case 'B': return 'BLOCKED';
    case 'P': return 'PENDING';
    default: return 'PENDING';
  }
}

// Map display status back to Prisma
function mapStatusToPrisma(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'A';
    case 'BLOCKED': return 'B';
    case 'PENDING': return 'P';
    default: return 'A';
  }
}

export default function UserManagementPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [users, setUsers] = useState<APIUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<APIUser | null>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BLOCKED' | 'PENDING'>('ACTIVE');

  // Fetch users from API
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/users?page=1&pageSize=1000`);
      if (response.data) {
        // Wrap single item or array
        const items = Array.isArray(response.data) ? response.data : (response.data.items || []);
        setUsers(items);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      addToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  // Open Edit Dialog
  const handleOpenEdit = (user: APIUser) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName || '');
    setEditStatus(mapStatus(user.status));
    setIsEditOpen(true);
  };

  // Save Edit Dialog via API
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      await axios.patch(`/api/admin/user/${selectedUser.id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        status: mapStatusToPrisma(editStatus),
      });

      addToast('Customer updated successfully', 'success');
      setIsEditOpen(false);
      fetchUsers(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update customer';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status via API (Block/Unblock)
  const toggleStatus = async (user: APIUser) => {
    const nextStatus = user.status === 'B' ? 'A' : 'B';
    const displayStatus = user.status === 'B' ? 'ACTIVE' : 'BLOCKED';

    try {
      await axios.patch(`/api/admin/user/${user.id}`, {
        status: nextStatus,
      });

      addToast(`Customer ${displayStatus === 'BLOCKED' ? 'blocked' : 'unblocked'}`, 'success');
      fetchUsers(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update customer status';
      addToast(errMsg, 'error');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (user: APIUser) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  // Confirm Delete via API
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const response = await axios.delete(`/api/admin/user/${selectedUser.id}`);
      if (response.data?.success) {
        addToast('Customer deleted successfully', 'success');
        setSelectedUser(null);
        setIsDeleteOpen(false);
        fetchUsers(currentPage);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to delete customer';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter only customers (not admins)
  const customers = users.filter(u => u.email !== 'admin@nexpo.com');

  // Client-side pagination
  const totalItems = customers.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Users List Container */}
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Customer Management</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Verify credentials and manage customer accounts.</p>
          </div>
          <Button 
            variant="primary" 
            className="px-4 py-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Add Customer</span>
          </Button>
        </div>

        {/* Table Card */}
        <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
          {isLoading ? (
            <div className="w-full py-xl flex flex-col items-center justify-center gap-md">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">Loading Customers...</span>
            </div>
          ) : (
          <div className="w-full overflow-x-auto scrollbar-hide">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Profile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((u) => {
                const displayStatus = mapStatus(u.status);
                return (
                  <TableRow 
                    key={u.id} 
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt={`${u.firstName} ${u.lastName || ''}`} className="w-8 h-8 rounded-full border border-outline-variant object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-xs">
                            {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">{u.firstName} {u.lastName || ''}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono-data">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md font-label-md text-[10px] font-bold bg-surface-variant text-on-surface-variant">
                        CUSTOMER
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
                          title="Edit User"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => toggleStatus(u)}
                          className={`p-1 hover:bg-surface-container rounded-full transition-all ${
                            u.status === 'B' ? 'text-secondary hover:text-secondary' : 'text-on-surface-variant hover:text-error'
                          }`}
                          title={u.status === 'B' ? 'Unblock User' : 'Block User'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {u.status === 'B' ? 'lock_open' : 'lock'}
                          </span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(u)}
                          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all"
                          title="Delete User"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant italic">
                    No customers found.
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
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{selectedUser?.firstName} {selectedUser?.lastName || ''}</p>
            <p className="font-label-md text-[10px] text-on-surface-variant font-mono-data text-left">{selectedUser?.email}</p>
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

    </div>
  );
}