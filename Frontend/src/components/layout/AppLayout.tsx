import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PageTransition } from '../common/AnimatedTransitions';
import { SkipToContent } from '../a11y/SkipToContent';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
      {/* First focusable element on every authenticated page. */}
      <SkipToContent targetId="main-content" />

      <Header
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full focus:outline-none"
        >
          <ErrorBoundary>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
