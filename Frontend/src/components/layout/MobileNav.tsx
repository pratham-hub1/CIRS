import React, { useEffect } from 'react';
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
  BarChart3,
  KeyRound,
  History,
  Building2,
  RotateCcw,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Role } from '../../types/enums';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
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
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-600" /> Security Command
                  </div>
                  <nav className="space-y-1">
                    <NavLink to="/admin" end onClick={onClose} className={navClass}>
                      <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard / Operations
                    </NavLink>
                    <NavLink to="/admin/claims" onClick={onClose} className={navClass}>
                      <ClipboardCheck className="w-4 h-4 mr-3" /> Pending Claims
                    </NavLink>
                    <NavLink to="/admin/cases" onClick={onClose} className={navClass}>
                      <Archive className="w-4 h-4 mr-3" /> All Cases / Reports
                    </NavLink>
                    <NavLink to="/admin/found-items" onClick={onClose} className={navClass}>
                      <Layers className="w-4 h-4 mr-3" /> Found Items & Storage
                    </NavLink>
                    <NavLink to="/admin/storage" onClick={onClose} className={navClass}>
                      <Building2 className="w-4 h-4 mr-3" /> Storage Locations
                    </NavLink>
                    <NavLink to="/admin/redeem" onClick={onClose} className={navClass}>
                      <KeyRound className="w-4 h-4 mr-3" /> Collection & Handover
                    </NavLink>
                    <NavLink to="/admin/appeals" onClick={onClose} className={navClass}>
                      <RotateCcw className="w-4 h-4 mr-3" /> Appeals
                    </NavLink>
                    <NavLink to="/admin/analytics" onClick={onClose} className={navClass}>
                      <TrendingUp className="w-4 h-4 mr-3" /> Analytics
                    </NavLink>
                    <NavLink to="/admin/audit" onClick={onClose} className={navClass}>
                      <History className="w-4 h-4 mr-3" /> Audit Log
                    </NavLink>
                    <NavLink to="/notifications" onClick={onClose} className={navClass}>
                      <Bell className="w-4 h-4 mr-3" /> Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" onClick={onClose} className={navClass}>
                      <Settings className="w-4 h-4 mr-3" /> Profile & Settings
                    </NavLink>
                  </nav>
                </div>
              ) : (
                /* Student / Faculty Navigation (9 items) */
                <div>
                  <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Campus Recovery Desk
                  </div>
                  <nav className="space-y-1">
                    <NavLink to="/dashboard" end onClick={onClose} className={navClass}>
                      <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
                    </NavLink>
                    <NavLink to="/report/lost" onClick={onClose} className={navClass}>
                      <FileQuestion className="w-4 h-4 mr-3 text-rose-500" /> Report Lost Item
                    </NavLink>
                    <NavLink to="/report/found" onClick={onClose} className={navClass}>
                      <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Report Found Item
                    </NavLink>
                    <NavLink to="/search" onClick={onClose} className={navClass}>
                      <Search className="w-4 h-4 mr-3" /> Search & Browse
                    </NavLink>
                    <NavLink to="/feed" onClick={onClose} className={navClass}>
                      <Compass className="w-4 h-4 mr-3" /> Community Feed
                    </NavLink>
                    <NavLink to="/my-cases" onClick={onClose} className={navClass}>
                      <FolderOpen className="w-4 h-4 mr-3" /> My Active Cases
                    </NavLink>
                    <NavLink to="/my-claims" onClick={onClose} className={navClass}>
                      <ClipboardCheck className="w-4 h-4 mr-3" /> My Claims
                    </NavLink>
                    <NavLink to="/notifications" onClick={onClose} className={navClass}>
                      <Bell className="w-4 h-4 mr-3" /> Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" onClick={onClose} className={navClass}>
                      <Settings className="w-4 h-4 mr-3" /> Profile & Settings
                    </NavLink>
                  </nav>
                </div>
              )}
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
