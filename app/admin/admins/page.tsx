'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_USERS, User } from '@/mock/data';

export default function AdminManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<'basic' | 'session'>('basic');
  
  // Forms state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'CUSTOMER'>('ADMIN');
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

    setIsEditOpen(false);
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
    const updated = users.filter(u => u.id !== selectedUser.id);
    setUsers(updated);
    saveUsersToStorage(updated);
    setSelectedUser(null);
    setIsDeleteOpen(false);
  };

  const admins = users.filter(u => u.role === 'ADMIN');
  const totalItems = admins.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = admins.slice(startIndex, startIndex + itemsPerPage);

  const pageRange = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageRange.push(i);
  }

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
              const newId = `u${users.length + 1}`;
              const newUser: User = {
                id: newId,
                firstName: 'New',
                lastName: 'Admin',
                email: `newadmin${newId}@nexpo.com`,
                role: 'ADMIN',
                status: 'ACTIVE',
                lastLogin: 'Never'
              };
              const updated = [newUser, ...users];
              setUsers(updated);
              saveUsersToStorage(updated);
              setSelectedUser(newUser);
              setAdminModalTab('basic');
              setIsAdminDetailsOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-sm">shield_person</span>
            <span>Add Admin</span>
          </Button>
        </div>

        {/* Table Card */}
        <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
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
                return (
                  <TableRow 
                    key={u.id} 
                    onClick={() => {
                      setSelectedUser(u);
                      setAdminModalTab('basic');
                      setIsAdminDetailsOpen(true);
                    }}
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
                      <span className="px-2 py-0.5 rounded-md font-label-md text-[10px] font-bold bg-primary text-on-primary">
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
                          title="Edit Admin"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => toggleStatus(u)}
                          className={`p-1 hover:bg-surface-container rounded-full transition-all ${
                            u.status === 'BLOCKED' ? 'text-secondary hover:text-secondary' : 'text-on-surface-variant hover:text-error'
                          }`}
                          title={u.status === 'BLOCKED' ? 'Unblock Admin' : 'Block Admin'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {u.status === 'BLOCKED' ? 'lock_open' : 'lock'}
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
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-lg py-md border-t border-outline-variant/44 bg-surface-container-lowest gap-4">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium text-center sm:text-left">
            Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
          </span>
          <div className="flex items-center gap-sm">
            {currentPage > 1 && (
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
              >
                Back
              </button>
            )}
            {pageRange.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-primary text-on-primary shadow-sm active:scale-90'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
            {currentPage < totalPages && (
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-sm py-1 rounded hover:bg-surface-container text-xs font-bold transition-all flex items-center cursor-pointer text-on-surface-variant"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </Card>
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Admin Account" customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Modify Admin Account</h2>
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
                <option value="ADMIN">ADMIN (System Administrator)</option>
                <option value="CUSTOMER">CUSTOMER (Standard User)</option>
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
            <Button type="submit" variant="primary">
              Save Alterations
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
          <button className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold" onClick={handleConfirmDelete}>
            Remove Admin
          </button>
        </div>
      </Modal>

      {/* Admin Details Modal */}
      <Modal isOpen={isAdminDetailsOpen} onClose={() => setIsAdminDetailsOpen(false)} title="Admin Profile Details" customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        {selectedUser && (
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
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt={`${selectedUser.firstName} ${selectedUser.lastName || ''}`} className="w-16 h-16 rounded-full border border-outline-variant object-cover shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container font-black flex items-center justify-center text-xl shadow-sm">
                  {(selectedUser.firstName?.[0] || '') + (selectedUser.lastName?.[0] || '')}
                </div>
              )}
              <div className="flex flex-col gap-xs">
                <h3 className="font-headline-sm text-headline-sm text-primary font-black">
                  {selectedUser.firstName} {selectedUser.lastName || ''}
                </h3>
                <span className="text-xs text-on-surface-variant font-mono-data">{selectedUser.email}</span>
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
                    <span className="font-mono-data text-primary text-sm font-semibold">{selectedUser.id}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Verification State</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full font-label-md text-[10px] font-bold ${
                        selectedUser.status === 'ACTIVE'
                          ? 'bg-secondary-container/20 text-on-secondary-container'
                          : selectedUser.status === 'PENDING'
                          ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/20 pt-md mt-sm">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Access Level</span>
                    <span className="text-primary text-sm font-medium">ADMIN (System Administrator)</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/20 pt-md mt-sm">
                    <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Country/Region</span>
                    <span className="text-primary text-sm font-medium">India</span>
                  </div>
                </div>
              )}

              {adminModalTab === 'session' && (
                <div className="flex flex-col gap-lg pl-md border-l border-outline-variant/60">
                  <div className="relative flex flex-col gap-1">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-4 border-primary shadow-sm" />
                    <span className="text-primary font-bold text-sm">Last Account Authentication</span>
                    <span className="text-xs text-on-surface-variant">Logged in successfully via Admin Dashboard Console</span>
                    <span className="text-[10px] text-on-surface-variant/70 font-mono-data mt-0.5">
                      {selectedUser.lastLogin || 'Today, 11:24 AM'}
                    </span>
                  </div>
                  <div className="relative flex flex-col gap-1 border-t border-outline-variant/20 pt-md">
                    <div className="absolute -left-[23px] top-5 w-3.5 h-3.5 rounded-full bg-white border-4 border-outline-variant shadow-sm" />
                    <span className="text-primary font-medium text-sm">Client Session Device</span>
                    <span className="text-xs text-on-surface-variant">Chrome Web Browser • Windows OS (103.24.88.10)</span>
                    <span className="text-[10px] text-on-surface-variant/70 font-mono-data mt-0.5">Yesterday, 04:52 PM</span>
                  </div>
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
                  handleOpenEdit(selectedUser);
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
