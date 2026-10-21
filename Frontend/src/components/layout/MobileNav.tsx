import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  Search,
  Compass,
  FileQuestion,
  CheckCircle,
  FolderOpen,
  ClipboardCheck,
  Bell,
  Settings,
  Shield,
  Layers,
  Archive,
  KeyRound,
  History,
  Building2,
  RotateCcw,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Drawer behaves as a modal dialog: trap focus, close on Escape, lock scroll,
  // and restore focus to the trigger (the header menu button) on close.
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen);
  useEscapeKey(isOpen, () => onClose());
  useBodyScrollLock(isOpen);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/60 shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const handleLogout = async () => {
    onClose();
    await logout();
    window.location.replace('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop — decorative, hidden from assistive tech. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <motion.div
            ref={panelRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Primary navigation"
            tabIndex={-1}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10 focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
                  CI
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900">CIRS</span>
                  <span className="text-[10px] text-slate-500 block -mt-0.5">GSFC University</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* User Card */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-bold bg-brand-100 text-brand-700 uppercase">
                  {role || 'Student'}
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto scrollbar-thin">
              {isAdmin ? (
                /* Admin Navigation (11 items) */
                <div>
                  <div className="px-3 mb-2 text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-600" aria-hidden="true" /> Security Command
                  </div>
                  <nav aria-label="Security administration" className="space-y-1">
                    <NavLink to="/admin" end onClick={onClose} className={navClass}>
                      <LayoutDashboard className="w-4 h-4 mr-3" aria-hidden="true" /> Dashboard / Operations
                    </NavLink>
                    <NavLink to="/admin/claims" onClick={onClose} className={navClass}>
                      <ClipboardCheck className="w-4 h-4 mr-3" aria-hidden="true" /> Pending Claims
                    </NavLink>
                    <NavLink to="/admin/cases" onClick={onClose} className={navClass}>
                      <Archive className="w-4 h-4 mr-3" aria-hidden="true" /> All Cases / Reports
                    </NavLink>
                    <NavLink to="/admin/found-items" onClick={onClose} className={navClass}>
                      <Layers className="w-4 h-4 mr-3" aria-hidden="true" /> Found Items &amp; Storage
                    </NavLink>
                    <NavLink to="/admin/storage" onClick={onClose} className={navClass}>
                      <Building2 className="w-4 h-4 mr-3" aria-hidden="true" /> Storage Locations
                    </NavLink>
                    <NavLink to="/admin/redeem" onClick={onClose} className={navClass}>
                      <KeyRound className="w-4 h-4 mr-3" aria-hidden="true" /> Collection &amp; Handover
                    </NavLink>
                    <NavLink to="/admin/appeals" onClick={onClose} className={navClass}>
                      <RotateCcw className="w-4 h-4 mr-3" aria-hidden="true" /> Appeals
                    </NavLink>
                    <NavLink to="/admin/analytics" onClick={onClose} className={navClass}>
                      <TrendingUp className="w-4 h-4 mr-3" aria-hidden="true" /> Analytics
                    </NavLink>
                    <NavLink to="/admin/audit" onClick={onClose} className={navClass}>
                      <History className="w-4 h-4 mr-3" aria-hidden="true" /> Audit Log
                    </NavLink>
                    <NavLink to="/notifications" onClick={onClose} className={navClass}>
                      <Bell className="w-4 h-4 mr-3" aria-hidden="true" /> Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" onClick={onClose} className={navClass}>
                      <Settings className="w-4 h-4 mr-3" aria-hidden="true" /> Profile &amp; Settings
                    </NavLink>
                  </nav>
                </div>
              ) : (
                /* Student / Faculty Navigation (9 items) */
                <div>
                  <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Campus Recovery Desk
                  </div>
                  <nav aria-label="Campus recovery" className="space-y-1">
                    <NavLink to="/dashboard" end onClick={onClose} className={navClass}>
                      <LayoutDashboard className="w-4 h-4 mr-3" aria-hidden="true" /> Dashboard
                    </NavLink>
                    <NavLink to="/report/lost" onClick={onClose} className={navClass}>
                      <FileQuestion className="w-4 h-4 mr-3 text-rose-500" aria-hidden="true" /> Report Lost Item
                    </NavLink>
                    <NavLink to="/report/found" onClick={onClose} className={navClass}>
                      <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" aria-hidden="true" /> Report Found Item
                    </NavLink>
                    <NavLink to="/search" onClick={onClose} className={navClass}>
                      <Search className="w-4 h-4 mr-3" aria-hidden="true" /> Search &amp; Browse
                    </NavLink>
                    <NavLink to="/feed" onClick={onClose} className={navClass}>
                      <Compass className="w-4 h-4 mr-3" aria-hidden="true" /> Community Feed
                    </NavLink>
                    <NavLink to="/my-cases" onClick={onClose} className={navClass}>
                      <FolderOpen className="w-4 h-4 mr-3" aria-hidden="true" /> My Active Cases
                    </NavLink>
                    <NavLink to="/my-claims" onClick={onClose} className={navClass}>
                      <ClipboardCheck className="w-4 h-4 mr-3" aria-hidden="true" /> My Claims
                    </NavLink>
                    <NavLink to="/notifications" onClick={onClose} className={navClass}>
                      <Bell className="w-4 h-4 mr-3" aria-hidden="true" /> Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" onClick={onClose} className={navClass}>
                      <Settings className="w-4 h-4 mr-3" aria-hidden="true" /> Profile &amp; Settings
                    </NavLink>
                  </nav>
                </div>
              )}
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
