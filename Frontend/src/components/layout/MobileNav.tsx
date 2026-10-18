import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Compass,
  FileQuestion,
  CheckCircle,
  FolderOpen,
  ClipboardCheck,
  Bookmark,
  Bell,
  Settings,
  Shield,
  Layers,
  Archive,
  BarChart3,
  KeyRound,
  History,
  Building2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/enums';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, role, isAdmin, logout } = useAuth();

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

  if (!isOpen) return null;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-full bg-white shadow-2xl flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              CI
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">CIRS</span>
              <span className="text-[10px] text-slate-500 block -mt-1">GSFC University</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-700 uppercase">
            {role || 'Student'}
          </span>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          <nav className="space-y-1">
            <NavLink to="/dashboard" end onClick={onClose} className={navClass}>
              <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
            </NavLink>
            <NavLink to="/feed" onClick={onClose} className={navClass}>
              <Compass className="w-4 h-4 mr-3" /> Community Feed
            </NavLink>
            <NavLink to="/report/lost" onClick={onClose} className={navClass}>
              <FileQuestion className="w-4 h-4 mr-3 text-rose-500" /> Report Lost Item
            </NavLink>
            <NavLink to="/report/found" onClick={onClose} className={navClass}>
              <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Report Found Item
            </NavLink>
            <NavLink to="/my-cases" onClick={onClose} className={navClass}>
              <FolderOpen className="w-4 h-4 mr-3" /> My Cases
            </NavLink>
            <NavLink to="/my-claims" onClick={onClose} className={navClass}>
              <ClipboardCheck className="w-4 h-4 mr-3" /> My Claims
            </NavLink>
            <NavLink to="/saved-searches" onClick={onClose} className={navClass}>
              <Bookmark className="w-4 h-4 mr-3" /> Saved Searches
            </NavLink>
            <NavLink to="/notifications" onClick={onClose} className={navClass}>
              <Bell className="w-4 h-4 mr-3" /> Notifications
            </NavLink>
          </nav>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-100">
              <div className="px-3 mb-2 text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-brand-600" /> Security Staff
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin" end onClick={onClose} className={navClass}>
                  <BarChart3 className="w-4 h-4 mr-3" /> Analytics
                </NavLink>
                <NavLink to="/admin/cases" onClick={onClose} className={navClass}>
                  <Archive className="w-4 h-4 mr-3" /> Cases
                </NavLink>
                <NavLink to="/admin/claims" onClick={onClose} className={navClass}>
                  <ClipboardCheck className="w-4 h-4 mr-3" /> Claims
                </NavLink>
                <NavLink to="/admin/matches" onClick={onClose} className={navClass}>
                  <Layers className="w-4 h-4 mr-3" /> Matches
                </NavLink>
                <NavLink to="/admin/storage" onClick={onClose} className={navClass}>
                  <Building2 className="w-4 h-4 mr-3" /> Storage
                </NavLink>
                <NavLink to="/admin/redeem" onClick={onClose} className={navClass}>
                  <KeyRound className="w-4 h-4 mr-3" /> Redeem Token
                </NavLink>
                <NavLink to="/admin/audit" onClick={onClose} className={navClass}>
                  <History className="w-4 h-4 mr-3" /> Audit Trail
                </NavLink>
              </nav>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <NavLink to="/profile" onClick={onClose} className={navClass}>
              <Settings className="w-4 h-4 mr-3" /> Profile & Settings
            </NavLink>
          </div>
        </div>

        {/* Bottom Signout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
