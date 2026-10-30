import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PageTransition } from '../common/AnimatedTransitions';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { CommandPalette } from '../common/CommandPalette';
import { AmbientCanvas } from '../common/AmbientCanvas';
import { WelcomeTransitionOverlay } from '../common/WelcomeTransitionOverlay';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Compass,
  Search,
  Plus,
  Bell,
  User,
  Shield,
  FolderOpen,
  ClipboardCheck,
} from 'lucide-react';

const MobileDock: React.FC = () => {
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const dockClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
      isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-30 bg-[#0C0F17]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl flex items-center justify-around px-2 py-1 max-w-md mx-auto">
      {isAdmin ? (
        <>
          <NavLink to="/admin" end className={dockClass}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Hub</span>
          </NavLink>
          <NavLink to="/admin/cases" className={dockClass}>
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Cases</span>
          </NavLink>
          <NavLink to="/admin/claims" className={dockClass}>
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Claims</span>
          </NavLink>
          <NavLink to="/admin/matches" className={dockClass}>
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Radar</span>
          </NavLink>
          <NavLink to="/notifications" className={dockClass}>
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Alerts</span>
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/dashboard" className={dockClass}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </NavLink>
          <NavLink to="/feed" className={dockClass}>
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Feed</span>
          </NavLink>
          <NavLink
            to="/report"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black shadow-lg hover:bg-neutral-200 transition-transform active:scale-90 -my-2"
          >
            <Plus className="w-5 h-5 font-bold" />
          </NavLink>
          <NavLink to="/search" className={dockClass}>
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Vault</span>
          </NavLink>
          <NavLink to="/notifications" className={dockClass}>
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Alerts</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};

const LayoutContent: React.FC = () => {
  const { isMobileOpen, closeMobileMenu, openMobileMenu } = useSidebar();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col font-sans text-slate-100 antialiased selection:bg-white selection:text-black relative">
      <AmbientCanvas particleCount={32} className="opacity-40" />
      <WelcomeTransitionOverlay />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          onToggleMobileMenu={openMobileMenu}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <MobileNav isOpen={isMobileOpen} onClose={closeMobileMenu} />
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* Main Full-Width Content Container (Expansive & De-congested) */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full pb-28 lg:pb-16">
          <ErrorBoundary>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </main>

        {/* Mobile Floating Bottom Dock */}
        <MobileDock />
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};
