import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div
        className={`${sizeClasses} border-slate-200 border-t-brand-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {label && <p className="mt-3 text-sm text-slate-500 font-medium">{label}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-20 h-5 bg-slate-200 rounded" />
        <div className="w-24 h-5 bg-slate-200 rounded-full" />
      </div>
      <div className="w-3/4 h-6 bg-slate-200 rounded mb-2" />
      <div className="w-full h-4 bg-slate-100 rounded mb-4" />
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="w-28 h-4 bg-slate-200 rounded" />
        <div className="w-16 h-4 bg-slate-200 rounded" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-4 bg-slate-200 rounded ${i === columns - 1 ? 'w-16 ml-auto' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  );
};
