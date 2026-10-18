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

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const ItemStatusBadge: React.FC<{ status: ItemStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  switch (status) {
    case ItemStatus.LOST_REPORTED:
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case ItemStatus.FOUND:
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case ItemStatus.READY_FOR_COLLECTION:
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case ItemStatus.RETURNED:
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case ItemStatus.ARCHIVED:
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case ItemStatus.UNCLAIMED:
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {STATUS_LABELS[status] || status}
    </span>
  );
};

export const ClaimStatusBadge: React.FC<{ status: ClaimStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  switch (status) {
    case ClaimStatus.PENDING:
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case ClaimStatus.INFO_REQUESTED:
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case ClaimStatus.APPROVED:
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case ClaimStatus.REJECTED:
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case ClaimStatus.WITHDRAWN:
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {CLAIM_STATUS_LABELS[status] || status}
    </span>
  );
};

export const VerificationLevelBadge: React.FC<{ level: VerificationLevel }> = ({ level }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (level === VerificationLevel.HIGH) {
    color = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (level === VerificationLevel.MEDIUM) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (level === VerificationLevel.LOW) {
    color = 'bg-sky-50 text-sky-800 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {level} Verification
    </span>
  );
};

export const ItemTypeBadge: React.FC<{ type: ItemType }> = ({ type }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase border ${
        type === ItemType.LOST
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      {type}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: ItemCategory }> = ({ category }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {CATEGORY_LABELS[category] || category}
    </span>
  );
};

export const RoleBadge: React.FC<{ role?: Role | null }> = ({ role }) => {
  if (!role) return null;
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (role === Role.ADMIN) {
    color = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (role === Role.FACULTY) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (role === Role.STUDENT) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${color}`}>
      {role}
    </span>
  );
};

