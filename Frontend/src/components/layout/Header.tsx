import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  LogOut,
  Settings,
  Shield,
  Menu,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  CheckCheck,
  Search,
  X,
  User,
  Plus,
  KeyRound,
  Layers,
  Archive,
  BarChart3,
  Scale,
  Compass,
  Package,
  Command,
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Role } from '../../types/enums';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenCommandPalette,
}) => {
  const { user, role, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAdminOpsMenu, setShowAdminOpsMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const adminOpsMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
      if (adminOpsMenuRef.current && !adminOpsMenuRef.current.contains(target)) {
        setShowAdminOpsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
      isActive
        ? 'bg-white/10 text-white shadow-sm'
        : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0C10]/85 backdrop-blur-xl border-b border-white/[0.07] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Emblem */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 text-neutral-400 rounded-xl lg:hidden hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to={role === Role.ADMIN ? '/admin' : '/dashboard'}
            className="flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center text-white font-bold text-xs tracking-widest shadow-sm group-hover:border-white/30 transition-all">
              CI
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-display font-bold tracking-[0.25em] text-white">
                  CIRS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase hidden sm:block -mt-0.5">
                CAMPUS RECOVERY
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center space-x-1 bg-neutral-950/60 border border-white/[0.07] p-1 rounded-full shadow-inner">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                Overview
              </NavLink>
              <NavLink to="/admin/cases" className={navLinkClass}>
                Cases Desk
              </NavLink>
              <NavLink to="/admin/found-items" className={navLinkClass}>
                Intake & Custody
              </NavLink>
              <NavLink to="/admin/claims" className={navLinkClass}>
                Claims
              </NavLink>
              <NavLink to="/admin/matches" className={navLinkClass}>
                Match Radar
              </NavLink>

              {/* Admin Ops Dropdown */}
              <div className="relative" ref={adminOpsMenuRef}>
                <button
                  onClick={() => setShowAdminOpsMenu(!showAdminOpsMenu)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                    location.pathname.startsWith('/admin/storage') ||
                    location.pathname.startsWith('/admin/redeem') ||
                    location.pathname.startsWith('/admin/audit') ||
                    location.pathname.startsWith('/admin/appeals')
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Operations</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                <AnimatePresence>
                  {showAdminOpsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-52 bg-[#12151D] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs"
                    >
                      <Link
                        to="/admin/storage-locations"
                        onClick={() => setShowAdminOpsMenu(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Archive className="w-4 h-4 text-neutral-400" />
                        <span>Storage & Lockers</span>
                      </Link>
                      <Link
                        to="/admin/redeem"
                        onClick={() => setShowAdminOpsMenu(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-neutral-400" />
                        <span>Redeem Pass Token</span>
                      </Link>
                      <Link
                        to="/admin/appeals"
                        onClick={() => setShowAdminOpsMenu(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Scale className="w-4 h-4 text-neutral-400" />
                        <span>Appeals Review</span>
                      </Link>
                      <Link
                        to="/admin/audit-log"
                        onClick={() => setShowAdminOpsMenu(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-neutral-400" />
                        <span>Audit Telemetry</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Overview
              </NavLink>
              <NavLink to="/feed" className={navLinkClass}>
                Community Feed
              </NavLink>
              <NavLink to="/search" className={navLinkClass}>
                Browse Vault
              </NavLink>
              <NavLink to="/my-cases" className={navLinkClass}>
                My Cases
              </NavLink>
              <NavLink to="/my-claims" className={navLinkClass}>
                My Claims
              </NavLink>
              <Link
                to="/report"
                className="bg-white text-black hover:bg-neutral-200 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Item</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right: Search shortcut, Notifications, User menu */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Global search trigger (Cmd+K) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Quick Search (⌘K)"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-neutral-400 hover:text-white transition-all text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Search...</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                ⌘K
              </kbd>
            </button>
          )}

          {role && (
            <div className="hidden md:block">
              <RoleBadge role={role} />
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-neutral-400 rounded-full hover:text-white hover:bg-white/[0.06] transition-all focus:outline-none"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-[#12151D] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50 text-white"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-neutral-900/60">
                    <div className="flex items-center space-x-2">
                      <span className="font-display uppercase tracking-widest text-xs font-semibold text-neutral-200">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white text-black rounded-full">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <Sparkles className="w-5 h-5 text-neutral-500 mx-auto mb-2" />
                        <p className="text-xs font-medium text-neutral-300">All caught up</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">No new alerts right now.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3.5 text-xs flex items-start space-x-3 hover:bg-white/[0.04] transition-colors cursor-pointer ${
                            !n.readAt ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`leading-relaxed ${
                                !n.readAt ? 'font-medium text-white' : 'text-neutral-400'
                              }`}
                            >
                              {n.message}
                            </p>
                            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {!n.readAt && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-white/[0.06] bg-neutral-950/80 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center justify-center"
                    >
                      View all alerts <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-white/[0.06] transition-all focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 mt-2.5 w-60 bg-[#12151D] border border-white/[0.08] rounded-2xl shadow-2xl p-1.5 z-50 text-white"
                >
                  <div className="px-3.5 py-3 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.name || 'Verified User'}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {user?.email || ''}
                    </p>
                    {(user?.campus?.name || user?.campusId) && (
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">
                        {user.campus?.name || user.campusId}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-neutral-400" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Bell className="w-4 h-4 text-neutral-400" />
                      <span>Notifications</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-white/[0.06]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
