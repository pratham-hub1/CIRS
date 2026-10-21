import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// framer-motion relies on rAF-driven animations that make component tests
// timing-dependent. Replace it with a synchronous passthrough so assertions on
// roles, focus and ARIA attributes are deterministic.
vi.mock('framer-motion', async () => {
  const React = await import('react');

  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
      const {
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        variants: _variants,
        layout: _layout,
        ...rest
      } = props as Record<string, unknown> & { children?: React.ReactNode };
      return React.createElement(tag, { ...rest, ref }, children as React.ReactNode);
    });

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, key: string) => passthrough(key),
      },
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

afterEach(() => {
  cleanup();
});
