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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/enums';

export const Sidebar: React.FC = () => {
  const { role, isAdmin } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Core Discovery & Reporting */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Campus Lost & Found
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" end className={navClass}>
              <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              Dashboard
            </NavLink>
            <NavLink to="/feed" className={navClass}>
              <Compass className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              Community Feed
            </NavLink>
            <NavLink to="/report/lost" className={navClass}>
              <FileQuestion className="w-4 h-4 mr-3 text-rose-500" />
              Report Lost Item
            </NavLink>
            <NavLink to="/report/found" className={navClass}>
              <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />
              Report Found Item
            </NavLink>
          </nav>
        </div>

        {/* User Activity */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            My Records
          </div>
          <nav className="space-y-1">
            <NavLink to="/my-cases" className={navClass}>
              <FolderOpen className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              My Active Cases
            </NavLink>
            <NavLink to="/my-claims" className={navClass}>
              <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              My Ownership Claims
            </NavLink>
            <NavLink to="/saved-searches" className={navClass}>
              <Bookmark className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              Saved Searches
            </NavLink>
            <NavLink to="/notifications" className={navClass}>
              <Bell className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              Notifications
            </NavLink>
          </nav>
        </div>

        {/* Campus Security & Admin Section */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                Security Staff
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin" end className={navClass}>
                <BarChart3 className="w-4 h-4 mr-3 text-slate-400" />
                Analytics & Overview
              </NavLink>
              <NavLink to="/admin/cases" className={navClass}>
                <Archive className="w-4 h-4 mr-3 text-slate-400" />
                Manage Campus Cases
              </NavLink>
              <NavLink to="/admin/claims" className={navClass}>
                <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400" />
                Claim Verifications
              </NavLink>
              <NavLink to="/admin/matches" className={navClass}>
                <Layers className="w-4 h-4 mr-3 text-slate-400" />
                Match Reviews
              </NavLink>
              <NavLink to="/admin/storage" className={navClass}>
                <Building2 className="w-4 h-4 mr-3 text-slate-400" />
                Storage Locations
              </NavLink>
              <NavLink to="/admin/redeem" className={navClass}>
                <KeyRound className="w-4 h-4 mr-3 text-slate-400" />
                Token Redemption
              </NavLink>
              <NavLink to="/admin/audit" className={navClass}>
                <History className="w-4 h-4 mr-3 text-slate-400" />
                Audit Trail
              </NavLink>
            </nav>
          </div>
        )}

        {/* System & Settings */}
        <div className="pt-2 border-t border-slate-100">
          <nav className="space-y-1">
            <NavLink to="/profile" className={navClass}>
              <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-500" />
              Profile & Preferences
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
        <p className="font-medium text-slate-700">GSFC University</p>
        <p className="text-[11px] text-slate-400">Security Office • Ext. 4012</p>
      </div>
    </aside>
  );
};
