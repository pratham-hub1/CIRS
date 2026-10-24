import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Compass,
  FileQuestion,
  Package,
  FolderOpen,
  ClipboardCheck,
  Bell,
  Settings,
  Shield,
  Building2,
  Scale,
  BarChart3,
  KeyRound,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSidebar } from '../../context/SidebarContext';
import { Role } from '../../types/enums';

export const Sidebar: React.FC = () => {
  const { role, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getLinkClasses = (isActive: boolean) =>
    `group relative flex items-center ${
      isCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5'
    } text-xs font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan font-bold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
    }`;

  const renderTooltip = (title: string, badge?: number) => {
    if (!isCollapsed) return null;
    return (
      <AnimatePresence>
        {hoveredItem === title && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-white/15 text-white shadow-2xl text-xs font-sans whitespace-nowrap z-50 pointer-events-none flex items-center gap-2"
          >
            <span>{title}</span>
            {typeof badge === 'number' && badge > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-black font-bold text-[10px]">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-white/10 bg-[#090D1A]/90 backdrop-blur-2xl flex-shrink-0 min-h-[calc(100vh-4rem)] select-none transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header / Collapse toggle */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-neon-cyan" />
            <span className="font-display uppercase tracking-widest text-[11px] font-bold text-slate-300">
              {isAdmin ? 'SECURITY COMMAND' : 'RECOVERY PORTAL'}
            </span>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
        {isAdmin ? (
          /* ==========================================
             ADMIN / SECURITY STAFF NAVIGATION (11 ITEMS)
             ========================================== */
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="px-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  OPERATIONAL RADAR
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {/* 1. Dashboard / Operations */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Dashboard')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin" end className={({ isActive }) => getLinkClasses(isActive)}>
                  <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Dashboard / Operations</span>}
                </NavLink>
                {renderTooltip('Dashboard / Operations')}
              </div>

              {/* 2. Pending Claims */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Pending Claims')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/claims" className={({ isActive }) => getLinkClasses(isActive)}>
                  <ClipboardCheck className={`w-4 h-4 flex-shrink-0 text-amber-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Pending Claims</span>}
                </NavLink>
                {renderTooltip('Pending Claims')}
              </div>

              {/* 3. All Cases / Reports */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('All Cases')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/cases" className={({ isActive }) => getLinkClasses(isActive)}>
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 text-blue-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>All Cases / Reports</span>}
                </NavLink>
                {renderTooltip('All Cases / Reports')}
              </div>

              {/* 4. Found Items & Storage */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Found Items')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/found-items" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Package className={`w-4 h-4 flex-shrink-0 text-emerald-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Found Items & Storage</span>}
                </NavLink>
                {renderTooltip('Found Items & Storage')}
              </div>

              {/* 5. Storage Locations */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Storage Vaults')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/storage" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Building2 className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Storage Vaults</span>}
                </NavLink>
                {renderTooltip('Storage Vaults')}
              </div>

              {/* 6. Collection & Handover */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Collection Desk')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/redeem" className={({ isActive }) => getLinkClasses(isActive)}>
                  <KeyRound className={`w-4 h-4 flex-shrink-0 text-yellow-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Collection & Handover</span>}
                </NavLink>
                {renderTooltip('Collection & Handover')}
              </div>

              {/* 7. Appeals */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Appeals Queue')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/appeals" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Scale className={`w-4 h-4 flex-shrink-0 text-rose-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Appeals Review</span>}
                </NavLink>
                {renderTooltip('Appeals Review')}
              </div>

              {/* 8. Analytics */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Analytics')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/analytics" className={({ isActive }) => getLinkClasses(isActive)}>
                  <BarChart3 className={`w-4 h-4 flex-shrink-0 text-purple-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Telemetry & Analytics</span>}
                </NavLink>
                {renderTooltip('Telemetry & Analytics')}
              </div>

              {/* 9. Audit Log */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Audit Log')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/admin/audit" className={({ isActive }) => getLinkClasses(isActive)}>
                  <History className={`w-4 h-4 flex-shrink-0 text-slate-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Audit Log</span>}
                </NavLink>
                {renderTooltip('Audit Log')}
              </div>

              {/* 10. Notifications */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Notifications')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/notifications" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Bell className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-black font-bold text-[10px]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
                {renderTooltip('Notifications', unreadCount)}
              </div>

              {/* 11. Profile & Settings */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Settings')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/profile" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Settings className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Profile & Settings</span>}
                </NavLink>
                {renderTooltip('Profile & Settings')}
              </div>
            </nav>
          </div>
        ) : (
          /* ==========================================
             STUDENT & FACULTY NAVIGATION (9 ITEMS)
             ========================================== */
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="px-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  STUDENT RECOVERY DESK
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {/* 1. Dashboard */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Dashboard')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/dashboard" end className={({ isActive }) => getLinkClasses(isActive)}>
                  <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
                {renderTooltip('Dashboard')}
              </div>

              {/* 2. Report Lost Item */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Report Lost Item')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/report/lost" className={({ isActive }) => getLinkClasses(isActive)}>
                  <FileQuestion className={`w-4 h-4 flex-shrink-0 text-rose-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Report Lost Item</span>}
                </NavLink>
                {renderTooltip('Report Lost Item')}
              </div>

              {/* 3. Report Found Item */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Report Found Item')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/report/found" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Package className={`w-4 h-4 flex-shrink-0 text-emerald-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Report Found Item</span>}
                </NavLink>
                {renderTooltip('Report Found Item')}
              </div>

              {/* 4. Search & Browse */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Search & Browse')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/search" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Search className={`w-4 h-4 flex-shrink-0 text-cyan-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Search & Browse</span>}
                </NavLink>
                {renderTooltip('Search & Browse')}
              </div>

              {/* 5. Community Feed */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Community Feed')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/feed" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Compass className={`w-4 h-4 flex-shrink-0 text-purple-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Community Feed</span>}
                </NavLink>
                {renderTooltip('Community Feed')}
              </div>

              {/* 6. My Active Cases */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('My Active Cases')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/my-cases" className={({ isActive }) => getLinkClasses(isActive)}>
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 text-blue-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>My Active Cases</span>}
                </NavLink>
                {renderTooltip('My Active Cases')}
              </div>

              {/* 7. My Claims */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('My Claims')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/my-claims" className={({ isActive }) => getLinkClasses(isActive)}>
                  <ClipboardCheck className={`w-4 h-4 flex-shrink-0 text-amber-400 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>My Claims & Tokens</span>}
                </NavLink>
                {renderTooltip('My Claims & Tokens')}
              </div>

              {/* 8. Notifications */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Notifications')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/notifications" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Bell className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-black font-bold text-[10px]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
                {renderTooltip('Notifications', unreadCount)}
              </div>

              {/* 9. Profile & Settings */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredItem('Settings')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink to="/profile" className={({ isActive }) => getLinkClasses(isActive)}>
                  <Settings className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>Profile & Settings</span>}
                </NavLink>
                {renderTooltip('Profile & Settings')}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Futuristic Telemetry Footer */}
      <div className="p-3 border-t border-white/10 bg-[#050811]/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              GSFC SECURE
            </span>
            <span>PRESS ⌘B</span>
          </div>
        ) : (
          <div className="text-center font-mono text-[9px] text-cyan-400">
            ⌘B
          </div>
        )}
      </div>
    </aside>
  );
};
