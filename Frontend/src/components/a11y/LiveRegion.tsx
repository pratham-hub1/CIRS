import React from 'react';
import { cn } from '../../lib/utils';

interface LiveRegionProps {
  /** Text to announce. Empty strings are announced as "cleared" by some ATs. */
  message: string;
  /** `assertive` interrupts the user; `polite` waits for a pause. */
  politeness?: 'polite' | 'assertive';
  className?: string;
  id?: string;
}

/**
 * A screen-reader live region.
 *
 * Screen readers only announce content that changes *after* the region exists,
 * so the element must always be present in the DOM (even when empty) — never
 * conditionally rendered. Render this once and drive it with `message`.
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  className,
  id,
}) => (
  <div
    id={id}
    role={politeness === 'assertive' ? 'alert' : 'status'}
    aria-live={politeness}
    aria-atomic="true"
    className={cn(className)}
  >
    {message}
  </div>
);
