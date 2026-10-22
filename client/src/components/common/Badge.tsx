import React from 'react';

type BadgeVariant =
  | 'in_progress'
  | 'completed'
  | 'incomplete'
  | 'pending'
  | 'valid'
  | 'invalid'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'employee'
  | 'manager'
  | 'admin'
  | 'default';

interface BadgeProps {
  status: string;
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Working status
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  incomplete: 'bg-rose-50 text-rose-700 border-rose-200',

  // Verification status
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  invalid: 'bg-rose-50 text-rose-700 border-rose-200',

  // Overtime status
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',

  // Active status
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',

  // Roles
  employee: 'bg-blue-50 text-blue-700 border-blue-200',
  manager: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',

  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatLabel = (status: string) => {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const Badge: React.FC<BadgeProps> = ({ status, variant, label, className = '' }) => {
  const key = (variant || status || 'default').toLowerCase();
  const style = statusStyles[key] || statusStyles.default;
  const displayLabel = label || formatLabel(status);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
