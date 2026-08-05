'use client';

import React from 'react';
import { SnackbarProvider } from 'notistack';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={5}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
    >
      {children}
    </SnackbarProvider>
  );
}
