'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { MOCK_CATEGORIES, Category } from '@/mock/data';
import { Pagination } from '@/components/ui/Pagination';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('bg-primary-fixed text-on-primary-fixed-variant');
  const [icon, setIcon] = useState('category');

  const handleOpenAdd = () => {
    setName('');
    setCode('');
    setColor('bg-primary-fixed text-on-primary-fixed-variant');
    setIcon('category');
    setIsEditing(false);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setSelectedCat(cat);
    setName(cat.name);
    setCode(cat.code);
    setColor(cat.color);
    setIcon(cat.icon);
    setIsEditing(true);
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedCat) {
      setCategories(prev => prev.map(c => {
        if (c.id === selectedCat.id) {
          return { ...c, name, code, color, icon };
        }
        return c;
      }));
    } else {
      const newCat: Category = {
        id: `c${categories.length + 1}`,
        name,
        code: code.toUpperCase().trim(),
        color,
        icon
      };
      setCategories([...categories, newCat]);
    }
    setIsAddEditOpen(false);
  };

  const handleOpenDelete = (cat: Category) => {
    setSelectedCat(cat);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedCat) return;
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== selectedCat.id);
      // Reset page if it exceeds the new total pages
      const newTotalPages = Math.max(Math.ceil(updated.length / itemsPerPage), 1);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
      return updated;
    });
    setIsDeleteOpen(false);
  };

  const totalItems = categories.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
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

      {/* Grid of Cards / Table */}
      <Card className="bg-surface-container-lowest p-0 overflow-hidden" glass={false}>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visual Icon</TableHead>
              <TableHead>Classification Name</TableHead>
              <TableHead>System Key (Code)</TableHead>
              <TableHead>Tailwind Tag Style</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-outline-variant/50">
                    <span className="material-symbols-outlined text-md">{cat.icon}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-primary">
                  {cat.name}
                </TableCell>
                <TableCell className="font-mono-data text-mono-data text-on-surface-variant">
                  {cat.code}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full font-label-md text-[10px] font-bold ${cat.color}`}>
                    {cat.code} Tag
                  </span>
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all"
                      title="Edit Category"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
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

      {/* Add / Edit Modal */}
      <Modal 
        isOpen={isAddEditOpen} 
        onClose={() => setIsAddEditOpen(false)} 
        title={isEditing ? "Modify Spend Category" : "Establish Spend Category"}
        customHeader={true}
        cardPadding="p-0"
        maxWidth="max-w-[540px]"
      >
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{isEditing ? "Modify Spend Category" : "Establish Spend Category"}</h2>
          </div>
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90" onClick={() => setIsAddEditOpen(false)}>
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-lg flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Software License"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">System Code</label>
            <input
              type="text"
              required
              placeholder="e.g. SOFTWARE"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Material Symbol Icon</label>
            <div className="relative">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                <option value="category">category (Standard)</option>
                <option value="restaurant">restaurant (Food)</option>
                <option value="home_work">home_work (Rent)</option>
                <option value="flight">flight (Travel)</option>
                <option value="bolt">bolt (Utilities)</option>
                <option value="code">code (Developer/Software)</option>
                <option value="campaign">campaign (Marketing)</option>
                <option value="hardware">hardware (Equipment)</option>
                <option value="local_shipping">local_shipping (Logistics)</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant font-bold uppercase ml-1">Color Design Preset</label>
            <div className="relative">
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 px-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none"
              >
                <option value="bg-primary-fixed text-on-primary-fixed-variant">Midnight Navy / Navy Fixed</option>
                <option value="bg-secondary-container text-on-secondary-container">Mint / Forest Green Container</option>
                <option value="bg-tertiary-fixed text-on-tertiary-fixed-variant">Indigo / Purple Fixed</option>
                <option value="bg-error-container text-on-error-container">Rose / Crimson Container</option>
                <option value="bg-surface-variant text-on-surface-variant">Neutral Gray / Slate</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-outline-variant/30 pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Save Alterations" : "Establish Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Deconstruct Category Classification" customHeader={true} cardPadding="p-0" maxWidth="max-w-md">
        <div className="pt-xl px-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-error text-[32px]">warning</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Delete Category?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            This action cannot be undone. Are you sure you want to delete this expense category record?
          </p>
        </div>

        <div className="mx-xl my-lg p-md bg-surface-container rounded-lg border border-outline-variant flex items-center gap-md">
          <div className="flex-grow min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold text-left">Selected Category</p>
            <p className="font-body-md text-body-md font-semibold text-on-surface truncate text-left">{selectedCat?.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Code Key</p>
            <p className="font-mono-data text-mono-data text-error font-bold">{selectedCat?.code}</p>
          </div>
        </div>

        <div className="p-lg bg-surface-container-low flex flex-col-reverse sm:flex-row gap-md sm:justify-end border-t border-outline-variant">
          <button className="px-xl h-11 flex items-center justify-center rounded-lg border border-outline text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold" onClick={() => setIsDeleteOpen(false)}>
            Keep
          </button>
          <button className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold" onClick={handleConfirmDelete}>
            Revoke Category
          </button>
        </div>
      </Modal>

    </div>
  );
}
