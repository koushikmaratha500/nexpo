'use client';

import React, { useEffect } from 'react';
import { Card } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-lg'
  customHeader?: boolean;
  cardPadding?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  children,
  maxWidth = 'max-w-md',
  customHeader = false,
  cardPadding = 'p-6'
}: ModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full ${maxWidth} z-10 animate-in fade-in zoom-in-95 duration-200`}>
        <Card className={`flex flex-col border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-2xl ${cardPadding}`} glass={false}>
          {/* Header */}
          {!customHeader && (
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <div className="flex items-center gap-3">
                {headerIcon}
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{title}</h3>
                  {subtitle && <p className="font-label-md text-label-md text-on-surface-variant mt-1">{subtitle}</p>}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-md">close</span>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className={customHeader ? 'w-full' : 'overflow-y-auto overflow-x-hidden max-h-[70vh] pr-xs'}>
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
}
