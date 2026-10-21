import { useEffect } from 'react';

/**
 * Locks background scrolling while `locked` is true.
 *
 * The previous inline `overflow` value is captured and restored on release so
 * that stacked overlays (e.g. a modal opened from a drawer) never leave the
 * page permanently unscrollable.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
