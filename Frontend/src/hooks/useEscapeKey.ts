import { useEffect, useRef } from 'react';

/**
 * Calls `handler` whenever the user presses Escape while `active` is true.
 *
 * The latest handler is kept in a ref so callers can pass an inline closure
 * without forcing the listener to be re-registered on every render.
 */
export function useEscapeKey(active: boolean, handler: (event: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);
}
