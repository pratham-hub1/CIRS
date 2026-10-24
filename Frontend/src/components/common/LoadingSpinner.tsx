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
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-2',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div
        className={`${sizeClasses} border-white/10 border-t-white rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {label && <p className="mt-3 text-xs text-neutral-400 font-medium tracking-wide">{label}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#12151D] rounded-2xl border border-white/[0.08] p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-20 h-5 bg-white/[0.05] rounded-md" />
        <div className="w-24 h-5 bg-white/[0.05] rounded-full" />
      </div>
      <div className="w-3/4 h-5 bg-white/[0.05] rounded-md mb-2" />
      <div className="w-full h-4 bg-white/[0.03] rounded-md mb-4" />
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="w-28 h-4 bg-white/[0.05] rounded-md" />
        <div className="w-16 h-4 bg-white/[0.05] rounded-md" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-4 bg-white/[0.05] rounded-md ${i === columns - 1 ? 'w-16 ml-auto' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  );
};
