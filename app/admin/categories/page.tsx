'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: string;
  name: string;
  code: string;
  type: 'DEBIT' | 'CREDIT';
  color: string | null;
  icon: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#14B8A3', '#F97316', '#6366F1',
];

const ICON_OPTIONS = [
  '', 'category', 'restaurant', 'home_work', 'flight', 'bolt',
  'code', 'campaign', 'hardware', 'local_shipping', 'account_balance',
  'receipt', 'paid', 'savings', 'trending_up', 'trending_down',
  'work', 'school', 'health_plus', 'sports_esports',
];

const TYPE_OPTIONS = [
  { value: 'DEBIT', label: 'Expense / Debit' },
  { value: 'CREDIT', label: 'Budget / Credit' },
];

const STATUS_OPTIONS = [
  { value: 'A', label: 'ACTIVE' },
  { value: 'P', label: 'PENDING' },
  { value: 'B', label: 'BLOCKED' },
];

function mapStatus(status: string): string {
  switch (status) {
    case 'A': return 'ACTIVE';
    case 'B': return 'BLOCKED';
    case 'P': return 'PENDING';
    default: return 'PENDING';
  }
}

function getTypeLabel(type: string): string {
  return type === 'DEBIT' ? 'Expense / Debit' : 'Budget / Credit';
}

function getTypeColor(type: string): string {
  return type === 'DEBIT' ? 'bg-error-container/20 text-error' : 'bg-secondary-container/20 text-on-secondary-container';
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function autoGenerateCode(name: string): string {
  return name.toUpperCase().replace(/\s+/g, '').trim();
}

function getRandomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export default function CategoryManagementPage() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleItemsPerPageChange = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formIcon, setFormIcon] = useState('');
  const [formStatus, setFormStatus] = useState('A');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Fetch categories from API
  const fetchCategories = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/categories?page=1&pageSize=1000`);
      if (response.data) {
        setCategories(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      addToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage, fetchCategories]);

  // Auto-generate code when name changes (only in create mode)
  const handleNameChange = (value: string) => {
    setFormName(value);
    const autoCode = autoGenerateCode(value);
    if (autoCode) {
      setFormCode(autoCode);
    } else {
      setFormCode('');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormName('');
    setFormCode('');
    setFormType('CREDIT');
    setFormColor(getRandomColor());
    setFormIcon('');
    setFormStatus('A');
    setShowColorPicker(false);
    setIsEditing(false);
    setSelectedCat(null);
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: Category) => {
    setSelectedCat(cat);
    setFormName(cat.name);
    setFormCode(cat.code);
    setFormType(cat.type as 'DEBIT' | 'CREDIT');
    setFormColor(cat.color || getRandomColor());
    setFormIcon(cat.icon || '');
    setFormStatus(cat.status);
    setShowColorPicker(false);
    setIsEditing(true);
    setIsAddEditOpen(true);
  };

  // Open View Modal
  const handleOpenView = (cat: Category) => {
    setSelectedCat(cat);
    setIsViewOpen(true);
  };

  // Save (Create or Edit) via API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      addToast('Name and Code are required', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.toUpperCase().trim(),
        type: formType,
        color: formColor || getRandomColor(),
        icon: formIcon || '',
        status: formStatus,
      };

      if (isEditing && selectedCat) {
        await axios.patch(`/api/admin/categories/${selectedCat.id}`, payload);
        addToast('Category updated successfully', 'success');
      } else {
        await axios.post('/api/admin/categories', payload);
        addToast('Category created successfully', 'success');
      }

      setIsAddEditOpen(false);
      fetchCategories(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to save category';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (cat: Category) => {
    setSelectedCat(cat);
    setIsDeleteOpen(true);
  };

  // Confirm Delete via API
  const handleConfirmDelete = async () => {
    if (!selectedCat) return;
    setIsSubmitting(true);

    try {
      await axios.delete(`/api/admin/categories/${selectedCat.id}`);
      addToast('Category deleted successfully', 'success');
      setIsDeleteOpen(false);
      fetchCategories(currentPage);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const errMsg = err.response?.data?.error || 'Category is linked to transactions and cannot be deleted';
        addToast(errMsg, 'error');
      } else {
        const errMsg = err.response?.data?.error || 'Failed to delete category';
        addToast(errMsg, 'error');
      }
      setIsDeleteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status directly from the card
  const toggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === 'B' ? 'A' : 'B';
    const display = cat.status === 'B' ? 'ACTIVE' : 'BLOCKED';

    try {
      await axios.patch(`/api/admin/categories/${cat.id}`, { status: nextStatus });
      addToast(`Category ${display === 'BLOCKED' ? 'blocked' : 'unblocked'}`, 'success');
      fetchCategories(currentPage);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update category status';
      addToast(errMsg, 'error');
    }
  };

  // Client-side pagination
  const totalItems = categories.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-black tracking-tight">Category Governance</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Define expense channels and classification keys.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} className="px-4 py-2">
          <span className="material-symbols-outlined text-sm">add_box</span>
          <span>New Category</span>
        </Button>
      </div>

      {/* Table Card */}
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        {isLoading ? (
          <div className="w-full py-xl flex flex-col items-center justify-center gap-md">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="font-label-md text-label-md text-on-surface-variant font-bold">Loading Categories...</span>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visual Preview</TableHead>
                    <TableHead>Classification Name</TableHead>
                    <TableHead>System Key (Code)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((cat) => (
                    <TableRow 
                      key={cat.id}
                      onClick={() => handleOpenView(cat)}
                      className="cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                            style={{ backgroundColor: cat.color || '#6B7280' }}
                          >
                            {cat.icon ? (
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cat.icon}</span>
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>category</span>
                            )}
                          </div>
                          <span className="font-mono-data text-xs text-on-surface-variant max-w-[60px] truncate">{cat.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {cat.name}
                      </TableCell>
                      <TableCell className="font-mono-data text-xs text-on-surface-variant">
                        {cat.code}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${getTypeColor(cat.type)}`}>
                          {cat.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${
                          mapStatus(cat.status) === 'ACTIVE'
                            ? 'bg-secondary-container/20 text-on-secondary-container'
                            : mapStatus(cat.status) === 'PENDING'
                            ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                            : 'bg-error-container/20 text-error'
                        }`}>
                          {mapStatus(cat.status)}
                        </span>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all"
                            title="Edit Category"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button 
                            onClick={() => toggleStatus(cat)}
                            className={`p-1 hover:bg-surface-container rounded-full transition-all ${
                              cat.status === 'B' 
                                ? 'text-secondary hover:text-secondary' 
                                : cat.status === 'P'
                                ? 'text-tertiary hover:text-tertiary'
                                : 'text-on-surface-variant hover:text-error'
                            }`}
                            title={cat.status === 'B' ? 'Unblock' : cat.status === 'P' ? 'Activate' : 'Block'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {cat.status === 'B' ? 'lock_open' : cat.status === 'P' ? 'pending' : 'lock'}
                            </span>
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(cat)}
                            className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all"
                            title="Delete Category"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant italic">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isAddEditOpen} 
        onClose={() => { setIsAddEditOpen(false); setSelectedCat(null); }} 
        title={isEditing ? "Modify Spend Category" : "Establish Spend Category"}
        customHeader={true}
        cardPadding="p-0"
        maxWidth="max-w-[540px]"
      >
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{isEditing ? "Modify Category" : "New Category"}</h2>
          </div>
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => { setIsAddEditOpen(false); setSelectedCat(null); }}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-lg flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Software License"
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
            />
          </div>

          {/* Code (Auto-generated from Name) */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">System Code (Auto-Generated)</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. SOFTWARE"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase().trim())}
                className="w-full h-12 px-md bg-surface-container-low border border-outline-variant rounded-lg font-mono-data text-mono-data focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all uppercase"
              />
              <span className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-label-md text-xs">
                Auto from Name
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Type</label>
            <div className="relative">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'DEBIT' | 'CREDIT')}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Icon</label>
            <div className="relative">
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt || 'empty'} value={opt}>{opt || '(None)'}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Color</label>
            <div className="flex items-center gap-sm">
              <div 
                className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-white shadow-sm cursor-pointer"
                style={{ backgroundColor: formColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Click to toggle color presets"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
              </div>
              <input
                type="text"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="flex-1 h-12 px-md bg-white border border-outline-variant rounded-lg font-mono-data text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                placeholder="#3B82F6"
              />
              <button 
                type="button"
                onClick={() => setFormColor(getRandomColor())}
                className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-all"
                title="Random Color"
              >
                <span className="material-symbols-outlined text-sm">shuffle</span>
              </button>
            </div>
            {showColorPicker && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                    className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: c, borderColor: formColor === c ? '#000' : '#ccc' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Status</label>
            <div className="relative">
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-outline-variant/30 pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsAddEditOpen(false); setSelectedCat(null); }}>
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
              <span>{isSubmitting ? (isEditing ? 'Saving...' : 'Establishing...') : (isEditing ? 'Save Alterations' : 'Establish Category')}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Category" customHeader={true} cardPadding="p-0" maxWidth="max-w-md">
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Delete Category?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            This action cannot be undone. If this category is linked to transactions, deletion will be blocked.
          </p>
        </div>

        <div className="mx-xl my-lg p-md bg-surface-container rounded-lg border border-outline-variant flex items-center gap-md">
          <div className="flex-grow min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold text-left">Selected Category</p>
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{selectedCat?.name}</p>
            <p className="font-label-md text-[10px] text-on-surface-variant font-mono-data text-left">{selectedCat?.code}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Type</p>
            <p className="font-body-md text-body-md text-error font-bold">{selectedCat?.type}</p>
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
            {isSubmitting ? 'Removing...' : 'Remove Category'}
          </button>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Category Details" customHeader={true} cardPadding="p-0" maxWidth="max-w-[540px]">
        {selectedCat && (
          <>
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Category Details</h2>
              </div>
              <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => setIsViewOpen(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="p-lg">
              <div className="flex items-center gap-md mb-lg">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: selectedCat.color || '#6B7280' }}
                >
                  {selectedCat.icon ? (
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{selectedCat.icon}</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>category</span>
                  )}
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary font-black">{selectedCat.name}</h3>
                  <span className="font-mono-data text-xs text-on-surface-variant">{selectedCat.code}</span>
                </div>
              </div>

              <div className="space-y-md">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">System ID</span>
                  <span className="font-mono-data text-primary text-sm">{selectedCat.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Type</span>
                  <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${getTypeColor(selectedCat.type)}`}>
                    {getTypeLabel(selectedCat.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Status</span>
                  <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${
                    mapStatus(selectedCat.status) === 'ACTIVE'
                      ? 'bg-secondary-container/20 text-on-secondary-container'
                      : mapStatus(selectedCat.status) === 'PENDING'
                      ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
                      : 'bg-error-container/20 text-error'
                  }`}>
                    {mapStatus(selectedCat.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Color Hex</span>
                  <span className="font-mono-data text-primary text-sm">{selectedCat.color || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Icon</span>
                  <span className="text-primary">{selectedCat.icon || '(none)'}</span>
                </div>
                <div className="border-t border-outline-variant/20 pt-md mt-sm">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Created At</span>
                  <span className="font-mono-data text-primary text-sm">{formatDateTime(selectedCat.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-bold text-xs uppercase">Updated At</span>
                  <span className="font-mono-data text-primary text-sm">{formatDateTime(selectedCat.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="px-lg py-md bg-surface-bright border-t border-outline-variant flex justify-end gap-sm">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewOpen(false);
                  if (selectedCat) handleOpenEdit(selectedCat);
                }}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Modify Category</span>
              </Button>
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}