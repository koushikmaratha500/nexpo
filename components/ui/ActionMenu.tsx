'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
  align?: 'left' | 'right';
}

export function ActionMenu({ items, ariaLabel = 'Actions', align = 'right' }: ActionMenuProps) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const minWidth = 196;
    const left = align === 'right' ? rect.right - minWidth : rect.left;
    setCoords({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(left, window.innerWidth - minWidth - 8)),
      minWidth,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuId, open]);

  const handleToggle = () => {
    setOpen((current) => {
      const next = !current;
      if (next) updatePosition();
      return next;
    });
  };

  const handleItemClick = (item: ActionMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setOpen(false);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          handleToggle();
        }}
        className="!px-2"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </Button>

      {open && coords && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={menuId}
              role="menu"
              className="fixed z-[120] rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-xl"
              style={{ top: coords.top, left: coords.left, minWidth: coords.minWidth }}
              onClick={(event) => event.stopPropagation()}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleItemClick(item);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left font-body-md transition-colors disabled:opacity-50 ${
                    item.variant === 'danger'
                      ? 'text-error hover:bg-error-container/10'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {item.icon ? (
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  ) : null}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
