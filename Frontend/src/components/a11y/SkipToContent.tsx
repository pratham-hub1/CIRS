import React from 'react';
import { cn } from '../../lib/utils';

interface SkipToContentProps {
  /** id of the element to move focus to (the main landmark). */
  targetId?: string;
  label?: string;
  className?: string;
}

/**
 * A "skip to content" link — the first focusable element on the page.
 *
 * It is visually hidden until it receives keyboard focus, at which point it
 * appears in the top-left corner. This lets keyboard and screen-reader users
 * bypass the repeated header and navigation chrome and jump straight to the
 * page's main content.
 */
export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
}) => (
  <a
    href={`#${targetId}`}
    className={cn(
      'sr-only',
      'focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
      'focus:inline-flex focus:items-center focus:px-4 focus:py-2.5',
      'focus:rounded-xl focus:bg-brand-600 focus:text-white focus:text-sm focus:font-semibold',
      'focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
      className,
    )}
  >
    {label}
  </a>
);
