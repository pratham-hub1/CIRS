import React from 'react';
import {
  ItemStatus,
  ClaimStatus,
  VerificationLevel,
  ItemType,
  ItemCategory,
  STATUS_LABELS,
  CLAIM_STATUS_LABELS,
  CATEGORY_LABELS,
  Role,
} from '../../types/enums';
import { cn } from '../../lib/utils';

export const ItemStatusBadge: React.FC<{ status: ItemStatus; size?: 'sm' | 'md'; className?: string }> = ({
  status,
  size = 'md',
  className,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200/80';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  switch (status) {
    case ItemStatus.LOST_REPORTED:
      colorClasses = 'bg-rose-50/80 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      pulse = true;
      break;
    case ItemStatus.FOUND:
      colorClasses = 'bg-amber-50/80 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      pulse = true;
      break;
    case ItemStatus.READY_FOR_COLLECTION:
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      dotColor = 'bg-sky-500';
      pulse = true;
      break;
    case ItemStatus.RETURNED:
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case ItemStatus.ARCHIVED:
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
    case ItemStatus.UNCLAIMED:
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-subtle tracking-tight',
        sizeClasses,
        colorClasses,
        className,
      )}
    >
      <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
        {pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', dotColor)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
      </span>
      <span>{STATUS_LABELS[status] || status}</span>
    </span>
  );
};

export const ClaimStatusBadge: React.FC<{ status: ClaimStatus; size?: 'sm' | 'md'; className?: string }> = ({
  status,
  size = 'md',
  className,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200/80';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  switch (status) {
    case ClaimStatus.PENDING:
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      pulse = true;
      break;
    case ClaimStatus.INFO_REQUESTED:
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      pulse = true;
      break;
    case ClaimStatus.APPROVED:
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case ClaimStatus.REJECTED:
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
    case ClaimStatus.WITHDRAWN:
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-subtle tracking-tight',
        sizeClasses,
        colorClasses,
        className,
      )}
    >
      <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
        {pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', dotColor)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
      </span>
      <span>{CLAIM_STATUS_LABELS[status] || status}</span>
    </span>
  );
};

export const VerificationLevelBadge: React.FC<{ level: VerificationLevel; className?: string }> = ({
  level,
  className,
}) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (level === VerificationLevel.HIGH) {
    color = 'bg-rose-50 text-rose-800 border-rose-200/80';
  } else if (level === VerificationLevel.MEDIUM) {
    color = 'bg-amber-50 text-amber-800 border-amber-200/80';
  } else if (level === VerificationLevel.LOW) {
    color = 'bg-sky-50 text-sky-800 border-sky-200/80';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border shadow-subtle tracking-tight',
        color,
        className,
      )}
    >
      {level} Verification
    </span>
  );
};

export const ItemTypeBadge: React.FC<{ type: ItemType; className?: string }> = ({ type, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border shadow-subtle',
        type === ItemType.LOST
          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        className,
      )}
    >
      {type}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: ItemCategory; className?: string }> = ({ category, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 shadow-subtle',
        className,
      )}
    >
      {CATEGORY_LABELS[category] || category}
    </span>
  );
};

export const RoleBadge: React.FC<{ role?: Role | null; className?: string }> = ({ role, className }) => {
  if (!role) return null;
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (role === Role.ADMIN) {
    color = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (role === Role.FACULTY) {
    color = 'bg-brand-50 text-brand-700 border-brand-200';
  } else if (role === Role.STUDENT) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-subtle',
        color,
        className,
      )}
    >
      {role === Role.ADMIN ? 'Security Admin' : role}
    </span>
  );
};
