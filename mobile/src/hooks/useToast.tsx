import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Alert } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const title =
      type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info';
    Alert.alert(title, message);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    addToast: ctx.showToast,
    success: (msg: string) => ctx.showToast(msg, 'success'),
    error: (msg: string) => ctx.showToast(msg, 'error'),
    warning: (msg: string) => ctx.showToast(msg, 'warning'),
    info: (msg: string) => ctx.showToast(msg, 'info'),
  };
}
