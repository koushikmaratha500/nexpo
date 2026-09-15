'use client';

import React from 'react';

interface PlanLimitToastActionProps {
  label: string;
  onClick: () => void;
}

export function PlanLimitToastAction({ label, onClick }: PlanLimitToastActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-3 shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-on-primary"
    >
      {label}
    </button>
  );
}
