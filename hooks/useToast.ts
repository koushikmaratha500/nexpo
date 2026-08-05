'use client';

import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3000) => {
      const variant: VariantType = type;
      enqueueSnackbar(message, { variant, autoHideDuration: duration });
    },
    [enqueueSnackbar]
  );

  const success = useCallback(
    (message: string, duration = 3000) => {
      enqueueSnackbar(message, { variant: 'success', autoHideDuration: duration });
    },
    [enqueueSnackbar]
  );

  const error = useCallback(
    (message: string, duration = 3000) => {
      enqueueSnackbar(message, { variant: 'error', autoHideDuration: duration });
    },
    [enqueueSnackbar]
  );

  const warning = useCallback(
    (message: string, duration = 3000) => {
      enqueueSnackbar(message, { variant: 'warning', autoHideDuration: duration });
    },
    [enqueueSnackbar]
  );

  const info = useCallback(
    (message: string, duration = 3000) => {
      enqueueSnackbar(message, { variant: 'info', autoHideDuration: duration });
    },
    [enqueueSnackbar]
  );

  return {
    showToast,
    addToast: showToast,
    success,
    error,
    warning,
    info,
    closeToast: closeSnackbar,
  };
}
