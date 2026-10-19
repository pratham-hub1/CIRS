import React from 'react';
import { NavLink } from 'react-router-dom';
import {
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
        ? 'bg-brand-50/90 text-brand-700 shadow-sm border border-brand-200/60 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/90 bg-white/80 backdrop-blur-sm flex-shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="flex-1 py-5 px-3.5 space-y-6 overflow-y-auto scrollbar-thin">
        {isAdmin ? (
          /* ==========================================
             ADMIN / SECURITY STAFF NAVIGATION (11 ITEMS)
             ========================================== */
          <div>
            <div className="px-3 mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                Security Command
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-100 text-brand-700 uppercase tracking-tight">
                Staff
              </span>
            </div>
            <nav className="space-y-1">
              {/* 1. Dashboard / Operations */}
              <NavLink to="/admin" end className={({ isActive }) => getLinkClasses(isActive)}>
                <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Dashboard / Operations</span>
              </NavLink>

              {/* 2. Pending Claims */}
              <NavLink to="/admin/claims" className={({ isActive }) => getLinkClasses(isActive)}>
                <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Pending Claims</span>
              </NavLink>

              {/* 3. All Cases / Reports */}
              <NavLink to="/admin/cases" className={({ isActive }) => getLinkClasses(isActive)}>
                <Archive className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>All Cases / Reports</span>
              </NavLink>

              {/* 4. Found Items & Storage */}
              <NavLink to="/admin/found-items" className={({ isActive }) => getLinkClasses(isActive)}>
                <Layers className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Found Items & Storage</span>
              </NavLink>

              {/* 5. Storage Locations */}
              <NavLink to="/admin/storage" className={({ isActive }) => getLinkClasses(isActive)}>
                <Building2 className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Storage Locations</span>
              </NavLink>

              {/* 6. Collection & Handover */}
              <NavLink to="/admin/redeem" className={({ isActive }) => getLinkClasses(isActive)}>
                <KeyRound className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Collection & Handover</span>
              </NavLink>

              {/* 7. Appeals */}
              <NavLink to="/admin/appeals" className={({ isActive }) => getLinkClasses(isActive)}>
                <RotateCcw className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Appeals</span>
              </NavLink>

              {/* 8. Analytics */}
              <NavLink to="/admin/analytics" className={({ isActive }) => getLinkClasses(isActive)}>
                <TrendingUp className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Analytics</span>
              </NavLink>

              {/* 9. Audit Log */}
              <NavLink to="/admin/audit" className={({ isActive }) => getLinkClasses(isActive)}>
                <History className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Audit Log</span>
              </NavLink>

              {/* 10. Notifications */}
              <NavLink to="/notifications" className={({ isActive }) => getLinkClasses(isActive)}>
                <Bell className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              {/* 11. Profile & Settings */}
              <NavLink to="/profile" className={({ isActive }) => getLinkClasses(isActive)}>
                <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span>Profile & Settings</span>
              </NavLink>
            </nav>
          </div>
        ) : (
          /* ==========================================
             STUDENT / FACULTY NAVIGATION (9 ITEMS)
             ========================================== */
          <div>
            <div className="px-3 mb-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Campus Item Recovery</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                {role || 'Student'}
              </span>
            </div>
            <nav className="space-y-1">
              {/* 1. Dashboard */}
              <NavLink to="/dashboard" end className={({ isActive }) => getLinkClasses(isActive)}>
                <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>Dashboard</span>
              </NavLink>

              {/* 2. Report Lost Item */}
              <NavLink to="/report/lost" className={({ isActive }) => getLinkClasses(isActive)}>
                <div className="w-4 h-4 mr-3 flex items-center justify-center">
                  <FileQuestion className="w-4 h-4 text-rose-500" />
                </div>
                <span>Report Lost Item</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
              </NavLink>

              {/* 3. Report Found Item */}
              <NavLink to="/report/found" className={({ isActive }) => getLinkClasses(isActive)}>
                <div className="w-4 h-4 mr-3 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <span>Report Found Item</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </NavLink>

              {/* 4. Search & Browse */}
              <NavLink to="/search" className={({ isActive }) => getLinkClasses(isActive)}>
                <Search className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>Search & Browse</span>
              </NavLink>

              {/* 5. Community Feed */}
              <NavLink to="/feed" className={({ isActive }) => getLinkClasses(isActive)}>
                <Compass className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>Community Feed</span>
              </NavLink>

              {/* 6. My Active Cases */}
              <NavLink to="/my-cases" className={({ isActive }) => getLinkClasses(isActive)}>
                <FolderOpen className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>My Active Cases</span>
              </NavLink>

              {/* 7. My Claims */}
              <NavLink to="/my-claims" className={({ isActive }) => getLinkClasses(isActive)}>
                <ClipboardCheck className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>My Claims</span>
              </NavLink>

              {/* 8. Notifications */}
              <NavLink to="/notifications" className={({ isActive }) => getLinkClasses(isActive)}>
                <Bell className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              {/* 9. Profile & Settings */}
              <NavLink to="/profile" className={({ isActive }) => getLinkClasses(isActive)}>
                <Settings className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                <span>Profile & Settings</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-[11px] leading-tight">GSFC University</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {isAdmin ? 'Security Desk • Ext. 4012' : 'Central Lost & Found'}
            </p>
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
