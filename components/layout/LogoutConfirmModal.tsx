'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: LogoutConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Logout"
      customHeader={true}
      cardPadding="p-0"
      maxWidth="max-w-md"
    >
      <div className="pt-xl px-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-md">
          <span className="material-symbols-outlined text-error text-[32px]">warning</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-sm font-black">Confirm Logout</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
          Are you sure you want to log out of your session?
        </p>
      </div>
      <div className="p-lg bg-surface-container-low flex flex-col-reverse sm:flex-row gap-md sm:justify-end border-t border-outline-variant mt-lg">
        <button
          type="button"
          className="px-xl h-11 flex items-center justify-center rounded-lg border border-outline text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors active:scale-95 duration-150 font-semibold cursor-pointer"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          className="px-xl h-11 flex items-center justify-center rounded-lg bg-error text-on-error font-title-md text-title-md shadow-md hover:opacity-90 transition-all active:scale-95 duration-150 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onConfirm}
        >
          Logout
        </button>
      </div>
    </Modal>
  );
}
