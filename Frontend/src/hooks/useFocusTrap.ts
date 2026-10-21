import { useEffect, useRef } from 'react';

/**
 * Selector for elements that can receive keyboard focus.
 * Kept in a single place so the trap and any future helpers stay in sync.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps keyboard focus inside a container while `active` is true and restores
 * focus to the previously focused element when it deactivates.
 *
 * Behaviour:
 *  - On activation, focus moves into the container (first focusable element,
 *    falling back to the container itself).
 *  - `Tab` / `Shift+Tab` wrap around at the boundaries instead of escaping.
 *  - On deactivation, focus is returned to whatever was focused before opening.
 *
 * Usage:
 *   const ref = useFocusTrap<HTMLDivElement>(isOpen);
 *   <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true">...</div>
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Remember where focus came from so we can return it on close.
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Move focus into the dialog on the next frame so entry animations do not
    // interrupt the initial focus.
    const focusTimer = window.setTimeout(() => {
      if (container.contains(document.activeElement)) return;
      const first = getFocusable()[0];
      (first ?? container).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (current === first || current === container || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);

      const toRestore = previouslyFocusedRef.current;
      if (toRestore && typeof toRestore.focus === 'function' && document.contains(toRestore)) {
        // Restore after the exit animation begins so React has committed the DOM.
        window.setTimeout(() => toRestore.focus(), 0);
      }
    };
  }, [active]);

  return containerRef;
}
