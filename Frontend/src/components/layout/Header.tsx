import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FolderOpen,
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Role } from '../../types/enums';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle transition-all">
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-500 rounded-xl lg:hidden hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to={role === Role.ADMIN ? '/admin' : '/dashboard'} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent-600 flex items-center justify-center text-white font-extrabold shadow-subtle group-hover:scale-105 transition-transform duration-200">
            <span className="text-sm tracking-wider font-mono">CI</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">CIRS</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
                PROD
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block -mt-0.5 font-medium tracking-tight">
              GSFC University Lost & Found
            </span>
          </div>
        </Link>
      </div>

      {/* Centre: Global Item Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center flex-1 max-w-md mx-6"
      >
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus items by name, category, or location..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 placeholder-slate-400 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        {role && (
          <div className="hidden md:block">
            <RoleBadge role={role} />
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-500 rounded-xl hover:text-slate-800 hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-pulseSubtle">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200/90 overflow-hidden z-50 origin-top-right"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">You're all caught up</p>
                      <p className="text-xs text-slate-400 mt-0.5">No new alerts right now.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3.5 text-xs flex items-start space-x-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          !n.readAt ? 'bg-brand-50/40' : ''
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0 text-brand-600">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`leading-relaxed ${
                              !n.readAt ? 'font-semibold text-slate-900' : 'text-slate-600'
                            }`}
                          >
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.readAt && (
                          <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center justify-center"
                  >
                    View all notifications <ExternalLink className="w-3 h-3 ml-1" />
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
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-800 block truncate max-w-[130px]">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight block -mt-0.5">
                {user?.email || 'Authenticated'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-elevated border border-slate-200/90 py-2 z-50 origin-top-right"
              >
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Verified Role:
                    </span>
                    <RoleBadge role={role || Role.STUDENT} />
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                >
                  <User className="w-4 h-4 mr-2.5 text-slate-400" />
                  Profile Details
                </Link>

                <Link
                  to="/profile#notifications"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                >
                  <Bell className="w-4 h-4 mr-2.5 text-slate-400" />
                  Notification Preferences
                </Link>

                {role === Role.ADMIN ? (
                  <Link
                    to="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50/70 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2.5 text-brand-600" />
                    Security Operations Desk
                  </Link>
                ) : (
                  <Link
                    to="/my-cases"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 mr-2.5 text-slate-400" />
                    My Active Cases
                  </Link>
                )}

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50/70 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
