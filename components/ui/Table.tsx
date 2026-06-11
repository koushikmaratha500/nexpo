import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-surface-container-low border-b border-outline-variant ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-outline-variant/30 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-surface-container-low/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`px-6 py-2 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ${alignClass} ${className}`}>
      {children}
    </th>
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function TableCell({ children, className = '', align = 'left', ...props }: TableCellProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td 
      className={`px-6 py-4 font-body-md text-body-md text-on-surface ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
