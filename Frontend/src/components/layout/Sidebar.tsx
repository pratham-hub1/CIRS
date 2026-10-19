import React from 'react';
import { NavLink } from 'react-router-dom';
import {
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
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Role } from '../../types/enums';

export const Sidebar: React.FC = () => {
  const { role, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const getLinkClasses = (isActive: boolean) =>
    `group relative flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-brand-50/80 text-brand-700 shadow-sm border border-brand-200/50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/90 bg-white/80 backdrop-blur-sm flex-shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="flex-1 py-5 px-3.5 space-y-6 overflow-y-auto scrollbar-thin">
        {/* Core Discovery & Reporting */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Discovery & Reporting</span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" end className={({ isActive }) => getLinkClasses(isActive)}>
              <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/feed" className={({ isActive }) => getLinkClasses(isActive)}>
              <Compass className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Community Feed</span>
            </NavLink>
            <NavLink to="/report/lost" className={({ isActive }) => getLinkClasses(isActive)}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <FileQuestion className="w-4 h-4 text-rose-500" />
              </div>
              <span>Report Lost Item</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
            </NavLink>
            <NavLink to="/report/found" className={({ isActive }) => getLinkClasses(isActive)}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span>Report Found Item</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </NavLink>
          </nav>
        </div>

        {/* User Activity */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>My Recovery Desk</span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/my-cases" className={({ isActive }) => getLinkClasses(isActive)}>
              <FolderOpen className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>My Cases</span>
            </NavLink>
            <NavLink to="/my-claims" className={({ isActive }) => getLinkClasses(isActive)}>
              <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>My Ownership Claims</span>
            </NavLink>
            <NavLink to="/saved-searches" className={({ isActive }) => getLinkClasses(isActive)}>
              <Bookmark className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Saved Searches</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => getLinkClasses(isActive)}>
              <Bell className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Campus Security & Admin Section */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                Security Staff Hub
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-100 text-brand-700 uppercase">
                Staff
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin" end className={({ isActive }) => getLinkClasses(isActive)}>
                <BarChart3 className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Command Analytics</span>
              </NavLink>
              <NavLink to="/admin/cases" className={({ isActive }) => getLinkClasses(isActive)}>
                <Archive className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Manage Cases</span>
              </NavLink>
              <NavLink to="/admin/claims" className={({ isActive }) => getLinkClasses(isActive)}>
                <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Claim Verifications</span>
              </NavLink>
              <NavLink to="/admin/matches" className={({ isActive }) => getLinkClasses(isActive)}>
                <Layers className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Match Reviews</span>
              </NavLink>
              <NavLink to="/admin/storage" className={({ isActive }) => getLinkClasses(isActive)}>
                <Building2 className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Storage Vaults</span>
              </NavLink>
              <NavLink to="/admin/redeem" className={({ isActive }) => getLinkClasses(isActive)}>
                <KeyRound className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Token Redemption</span>
              </NavLink>
              <NavLink to="/admin/audit" className={({ isActive }) => getLinkClasses(isActive)}>
                <History className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Audit Trail</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* System & Settings */}
        <div className="pt-2 border-t border-slate-100">
          <nav className="space-y-1">
            <NavLink to="/profile" className={({ isActive }) => getLinkClasses(isActive)}>
              <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Profile & Preferences</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-[11px] leading-tight">GSFC University</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Security Hub • Ext. 4012</p>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-700 tracking-tight">ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
