import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  Search,
  Compass,
  Package,
  FolderOpen,
  ClipboardCheck,
  Bell,
  Settings,
  Shield,
  KeyRound,
  Archive,
  BarChart3,
  Scale,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { RoleBadge } from '../common/Badge';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-white/10 text-white font-semibold shadow-sm'
        : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
    }`;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Slide-out panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 w-80 bg-[#0C0F17] border-r border-white/[0.08] shadow-2xl flex flex-col text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-neutral-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center text-white font-bold text-xs tracking-widest">
                  CI
                </div>
                <div>
                  <span className="text-sm font-display font-bold tracking-[0.2em] text-white">
                    CIRS
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono -mt-0.5 uppercase">
                    CAMPUS RECOVERY
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User card */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Verified User'}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">{user?.email || ''}</p>
                  {role && (
                    <div className="mt-1">
                      <RoleBadge role={role} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              {isAdmin ? (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                    Administrative Command
                  </div>
                  <NavLink to="/admin" end onClick={onClose} className={navLinkClass}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Central Hub</span>
                  </NavLink>
                  <NavLink to="/admin/cases" onClick={onClose} className={navLinkClass}>
                    <FolderOpen className="w-4 h-4" />
                    <span>Cases Desk</span>
                  </NavLink>
                  <NavLink to="/admin/found-items" onClick={onClose} className={navLinkClass}>
                    <Package className="w-4 h-4" />
                    <span>Intake & Custody</span>
                  </NavLink>
                  <NavLink to="/admin/claims" onClick={onClose} className={navLinkClass}>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Claims Adjudication</span>
                  </NavLink>
                  <NavLink to="/admin/matches" onClick={onClose} className={navLinkClass}>
                    <Shield className="w-4 h-4" />
                    <span>AI Match Radar</span>
                  </NavLink>

                  <div className="pt-3 px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                    Operations
                  </div>
                  <NavLink to="/admin/storage-locations" onClick={onClose} className={navLinkClass}>
                    <Archive className="w-4 h-4" />
                    <span>Storage & Lockers</span>
                  </NavLink>
                  <NavLink to="/admin/redeem" onClick={onClose} className={navLinkClass}>
                    <KeyRound className="w-4 h-4" />
                    <span>Redeem Pass Token</span>
                  </NavLink>
                  <NavLink to="/admin/appeals" onClick={onClose} className={navLinkClass}>
                    <Scale className="w-4 h-4" />
                    <span>Appeals Review</span>
                  </NavLink>
                  <NavLink to="/admin/audit-log" onClick={onClose} className={navLinkClass}>
                    <BarChart3 className="w-4 h-4" />
                    <span>Audit Telemetry</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                    Navigation
                  </div>
                  <NavLink to="/dashboard" onClick={onClose} className={navLinkClass}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/feed" onClick={onClose} className={navLinkClass}>
                    <Compass className="w-4 h-4" />
                    <span>Community Feed</span>
                  </NavLink>
                  <NavLink to="/search" onClick={onClose} className={navLinkClass}>
                    <Search className="w-4 h-4" />
                    <span>Browse Vault</span>
                  </NavLink>
                  <NavLink to="/my-cases" onClick={onClose} className={navLinkClass}>
                    <FolderOpen className="w-4 h-4" />
                    <span>My Cases</span>
                  </NavLink>
                  <NavLink to="/my-claims" onClick={onClose} className={navLinkClass}>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>My Claims</span>
                  </NavLink>

                  <div className="pt-2">
                    <Link
                      to="/report"
                      onClick={onClose}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white text-black font-semibold rounded-xl text-xs shadow-sm hover:bg-neutral-200 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Report Lost / Found Item</span>
                    </Link>
                  </div>
                </>
              )}

              <div className="pt-3 px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                Preferences
              </div>
              <NavLink to="/notifications" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center space-x-3 flex-1">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white text-black text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile" onClick={onClose} className={navLinkClass}>
                <Settings className="w-4 h-4" />
                <span>Account & Profile</span>
              </NavLink>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/[0.06] bg-neutral-950/60">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
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
