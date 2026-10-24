import React from 'react';
import { LucideIcon, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-[#12151D] rounded-2xl border border-white/[0.08] ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-neutral-400 max-w-sm mb-6 font-normal leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
