import React from 'react';
import { cn } from '../../lib/utils';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders content that is available to assistive technology but hidden from
 * sighted users. Useful for labelling controls that are otherwise icon-only
 * or for providing extra context to screen readers.
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, className }) => (
  <span className={cn('sr-only', className)}>{children}</span>
);
