'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_USERS, User } from '@/mock/data';
import { Pagination } from '@/components/ui/Pagination';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BLOCKED' | 'PENDING'>('ACTIVE');

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexpo_all_users');
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
      } catch (e) {}
    } else {
      localStorage.setItem('nexpo_all_users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  // Save to LocalStorage helper
  const saveUsersToStorage = (updatedUsers: User[]) => {
    localStorage.setItem('nexpo_all_users', JSON.stringify(updatedUsers));
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName || '');
    setEditRole(user.role);
    setEditStatus(user.status);
    setIsEditOpen(true);
  };

  // Save Edit Dialog
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const updated = users.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            firstName: editFirstName,
            lastName: editLastName,
            role: editRole,
            status: editStatus
          };
        }
        return u;
      });

      setUsers(updated);
      saveUsersToStorage(updated);

      setSelectedUser(prev => prev ? {
        ...prev,
        firstName: editFirstName,
        lastName: editLastName,
        role: editRole,
        status: editStatus
      } : null);

      setIsSubmitting(false);
      setIsEditOpen(false);
    }, 600);
  };

  // Toggle user status instantly (Block/Unblock)
  const toggleStatus = (user: User) => {
    const nextStatus: 'ACTIVE' | 'BLOCKED' = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updated);
    saveUsersToStorage(updated);
    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : null);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const updated = users.filter(u => u.id !== selectedUser.id);
      setUsers(updated);
      saveUsersToStorage(updated);
      setSelectedUser(null);
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }, 600);
  };

  const customers = users.filter(u => u.role === 'CUSTOMER');
  const totalItems = customers.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
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
            onClick={() => {
              const newId = `u${users.length + 1}`;
              const newUser: User = {
                id: newId,
                firstName: 'New',
                lastName: 'Customer',
                email: `newcustomer${newId}@nexpo.com`,
                role: 'CUSTOMER',
                status: 'PENDING',
                lastLogin: 'Never'
              };
              const updated = [newUser, ...users];
              setUsers(updated);
              saveUsersToStorage(updated);
              setSelectedUser(newUser);
              router.push(`/admin/users/${newId}`);
            }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Add Customer</span>
          </Button>
        </div>

        {/* Table Card */}
        <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
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
                return (
                  <TableRow 
                    key={u.id} 
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img src={u.avatar} alt={`${u.firstName} ${u.lastName || ''}`} className="w-8 h-8 rounded-full border border-outline-variant object-cover" />
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
                      <span className={`px-2 py-0.5 rounded-md font-label-md text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${
                        u.status === 'ACTIVE' 
                          ? 'bg-secondary-container/20 text-on-secondary-container'
                          : u.status === 'PENDING'
                          ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {u.status}
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
                            u.status === 'BLOCKED' ? 'text-secondary hover:text-secondary' : 'text-on-surface-variant hover:text-error'
                          }`}
                          title={u.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {u.status === 'BLOCKED' ? 'lock_open' : 'lock'}
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
            </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
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
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Access Level</label>
            <div className="relative">
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                <option value="CUSTOMER">CUSTOMER (Standard User)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
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
            <p className="font-body-md text-body-md text-error font-bold">{selectedUser?.role}</p>
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
