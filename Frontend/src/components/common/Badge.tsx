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
  AppealStatus,
} from '../../types/enums';
import { cn } from '../../lib/utils';

export const ItemStatusBadge: React.FC<{ status: ItemStatus; size?: 'sm' | 'md'; className?: string }> = ({
  status,
  size = 'md',
  className,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-white/[0.04] text-neutral-300 border-white/[0.08]';
  let dotColor = 'bg-neutral-400';

  switch (status) {
    case ItemStatus.LOST_REPORTED:
      colorClasses = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      dotColor = 'bg-rose-400';
      break;
    case ItemStatus.FOUND:
      colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      dotColor = 'bg-amber-400';
      break;
    case ItemStatus.READY_FOR_COLLECTION:
      colorClasses = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      dotColor = 'bg-blue-400';
      break;
    case ItemStatus.RETURNED:
      colorClasses = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      dotColor = 'bg-emerald-400';
      break;
    case ItemStatus.ARCHIVED:
      colorClasses = 'bg-white/[0.03] text-neutral-400 border-white/[0.06]';
      dotColor = 'bg-neutral-500';
      break;
    case ItemStatus.UNCLAIMED:
      colorClasses = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      dotColor = 'bg-purple-400';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium tracking-wide',
        sizeClasses,
        colorClasses,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5 shrink-0', dotColor)} />
      <span>{STATUS_LABELS[status] || status}</span>
    </span>
  );
};

export const ClaimStatusBadge: React.FC<{ status: ClaimStatus; size?: 'sm' | 'md'; className?: string }> = ({
  status,
  size = 'md',
  className,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-white/[0.04] text-neutral-300 border-white/[0.08]';
  let dotColor = 'bg-neutral-400';

  switch (status) {
    case ClaimStatus.PENDING:
      colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      dotColor = 'bg-amber-400';
      break;
    case ClaimStatus.INFO_REQUESTED:
      colorClasses = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      dotColor = 'bg-indigo-400';
      break;
    case ClaimStatus.APPROVED:
      colorClasses = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      dotColor = 'bg-emerald-400';
      break;
    case ClaimStatus.REJECTED:
      colorClasses = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      dotColor = 'bg-rose-400';
      break;
    case ClaimStatus.WITHDRAWN:
      colorClasses = 'bg-white/[0.03] text-neutral-400 border-white/[0.06]';
      dotColor = 'bg-neutral-500';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium tracking-wide',
        sizeClasses,
        colorClasses,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5 shrink-0', dotColor)} />
      <span>{CLAIM_STATUS_LABELS[status] || status}</span>
    </span>
  );
};

export const VerificationLevelBadge: React.FC<{ level: VerificationLevel; className?: string }> = ({
  level,
  className,
}) => {
  let color = 'bg-white/[0.04] text-neutral-300 border-white/[0.08]';
  if (level === VerificationLevel.HIGH) {
    color = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  } else if (level === VerificationLevel.MEDIUM) {
    color = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  } else if (level === VerificationLevel.LOW) {
    color = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
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
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider border',
        type === ItemType.LOST
          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
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
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium text-neutral-300 bg-white/[0.04] border border-white/[0.08]',
        className,
      )}
    >
      {CATEGORY_LABELS[category] || category}
    </span>
  );
};

export const RoleBadge: React.FC<{ role?: Role | null; className?: string }> = ({ role, className }) => {
  if (!role) return null;
  let color = 'bg-white/[0.04] text-neutral-300 border-white/[0.08]';
  if (role === Role.ADMIN) {
    color = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
  } else if (role === Role.FACULTY) {
    color = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  } else if (role === Role.STUDENT) {
    color = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
        color,
        className,
      )}
    >
      {role === Role.ADMIN ? 'Security Admin' : role}
    </span>
  );
};

export const AppealStatusBadge: React.FC<{ status: AppealStatus; className?: string }> = ({
  status,
  className,
}) => {
  let color = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  let dotColor = 'bg-amber-400';

  if (status === AppealStatus.ACCEPTED) {
    color = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    dotColor = 'bg-emerald-400';
  } else if (status === AppealStatus.REJECTED) {
    color = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    dotColor = 'bg-rose-400';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        color,
        className,
      )}
    >
      <span className={cn('inline-flex rounded-full h-1.5 w-1.5 mr-1.5 shrink-0', dotColor)} />
      <span>{status === AppealStatus.PENDING ? 'Pending Decision' : status}</span>
    </span>
  );
};
