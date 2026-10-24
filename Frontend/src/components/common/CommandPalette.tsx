import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  FileQuestion,
  Package,
  FolderOpen,
  ClipboardCheck,
  Building2,
  Scale,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Compass,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { Role } from '../../types/enums';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { role, isAdmin } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // General Actions
    {
      id: 'search-browse',
      title: 'Search & Browse Database',
      subtitle: 'Faceted lookup of all campus reports and found property',
      category: 'Navigation',
      icon: <Search className="w-4 h-4 text-cyan-400" />,
      action: () => navigate('/search'),
      keywords: ['find', 'search', 'browse', 'filter', 'items'],
      shortcut: 'S',
    },
    {
      id: 'report-lost',
      title: 'Report Lost Item',
      subtitle: 'File a missing belonging report for automatic matching',
      category: 'Actions',
      icon: <FileQuestion className="w-4 h-4 text-rose-400" />,
      action: () => navigate('/report/lost'),
      keywords: ['lost', 'missing', 'misplaced', 'wallet', 'phone'],
      shortcut: 'L',
    },
    {
      id: 'report-found',
      title: 'Report Found Item',
      subtitle: 'Turn in or log property recovered on campus grounds',
      category: 'Actions',
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      action: () => navigate('/report/found'),
      keywords: ['found', 'handed', 'register', 'turned in'],
      shortcut: 'F',
    },
    {
      id: 'community-feed',
      title: 'Community Feed',
      subtitle: 'Live broadcast of verified lost and found campus reports',
      category: 'Navigation',
      icon: <Compass className="w-4 h-4 text-purple-400" />,
      action: () => navigate('/feed'),
      keywords: ['feed', 'timeline', 'recent', 'stream'],
    },
    {
      id: 'my-cases',
      title: 'My Active Cases',
      subtitle: 'View, edit, or track your personal incident reports',
      category: 'Cases & Claims',
      icon: <FolderOpen className="w-4 h-4 text-blue-400" />,
      action: () => navigate('/my-cases'),
      keywords: ['cases', 'my cases', 'active', 'reports'],
      shortcut: 'C',
    },
    {
      id: 'my-claims',
      title: 'My Claims & Tokens',
      subtitle: 'Track verification status and single-use collection tokens',
      category: 'Cases & Claims',
      icon: <ClipboardCheck className="w-4 h-4 text-amber-400" />,
      action: () => navigate('/my-claims'),
      keywords: ['claims', 'tokens', 'verify', 'redeem'],
    },
    {
      id: 'notifications',
      title: 'Notification Center',
      subtitle: 'Alerts, security communications, and claim updates',
      category: 'System',
      icon: <Bell className="w-4 h-4 text-yellow-400" />,
      action: () => navigate('/notifications'),
      keywords: ['alerts', 'messages', 'notifications', 'updates'],
      shortcut: 'N',
    },
    {
      id: 'profile',
      title: 'Profile & Institutional Settings',
      subtitle: 'Account information, notifications, and security options',
      category: 'System',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => navigate('/profile'),
      keywords: ['settings', 'profile', 'account', 'security'],
      shortcut: 'P',
    },
    {
      id: 'toggle-sidebar',
      title: isCollapsed ? 'Expand Command Sidebar' : 'Collapse Command Sidebar',
      subtitle: 'Toggle between expanded navigation and compact icon dock',
      category: 'Interface',
      icon: isCollapsed ? (
        <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
      ) : (
        <PanelLeftClose className="w-4 h-4 text-cyan-400" />
      ),
      action: () => toggleSidebar(),
      keywords: ['sidebar', 'collapse', 'expand', 'dock', 'toggle'],
      shortcut: 'Ctrl+B',
    },

    // Admin Specific
    ...(isAdmin
      ? [
          {
            id: 'admin-dashboard',
            title: 'Security Command Overview',
            subtitle: 'Central operations desk, KPI telemetry, and case SLA',
            category: 'Security Staff',
            icon: <Shield className="w-4 h-4 text-cyan-400" />,
            action: () => navigate('/admin'),
            keywords: ['admin', 'dashboard', 'security', 'operations'],
          },
          {
            id: 'admin-claims',
            title: 'Pending Claims Queue',
            subtitle: 'Review proof of ownership and evaluate answers',
            category: 'Security Staff',
            icon: <ClipboardCheck className="w-4 h-4 text-amber-400" />,
            action: () => navigate('/admin/claims'),
            keywords: ['admin', 'claims', 'approve', 'reject'],
          },
          {
            id: 'admin-found-items',
            title: 'Found Items & Storage Vaults',
            subtitle: 'Holding queue, vault assignment, and handover desk',
            category: 'Security Staff',
            icon: <Package className="w-4 h-4 text-emerald-400" />,
            action: () => navigate('/admin/found-items'),
            keywords: ['vault', 'storage', 'holding', 'handover'],
          },
          {
            id: 'admin-appeals',
            title: 'Appeals Adjudication Queue',
            subtitle: 'Contested claims, appellant statements, and verdicts',
            category: 'Security Staff',
            icon: <Scale className="w-4 h-4 text-rose-400" />,
            action: () => navigate('/admin/appeals'),
            keywords: ['appeals', 'adjudicate', 'reject', 'verdict'],
          },
          {
            id: 'admin-analytics',
            title: 'Campus Analytics & Hotspots',
            subtitle: 'Loss recovery metrics, campus zone heatmaps, and trends',
            category: 'Security Staff',
            icon: <BarChart3 className="w-4 h-4 text-purple-400" />,
            action: () => navigate('/admin/analytics'),
            keywords: ['analytics', 'metrics', 'hotspots', 'recovery rate'],
          },
        ]
      : []),
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchesTitle = cmd.title.toLowerCase().includes(q);
    const matchesSubtitle = cmd.subtitle.toLowerCase().includes(q);
    const matchesCategory = cmd.category.toLowerCase().includes(q);
    const matchesKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
    return matchesTitle || matchesSubtitle || matchesCategory || matchesKeywords;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-[#090D1A]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 text-white"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#0D1424]/80">
              <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0 animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, search reports, or jump to page..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-sans"
              />
              <div className="flex items-center gap-1.5 ml-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                  ESC
                </span>
              </div>
            </div>

            {/* Command List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p className="text-sm font-medium">No matching commands or destinations</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for "lost", "claims", "vaults", or "search"
                  </p>
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 text-white shadow-neon-cyan'
                          : 'text-slate-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{item.title}</span>
                            <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.shortcut && (
                          <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-4 h-4 text-cyan-400 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Telemetry Footer */}
            <div className="px-4 py-2.5 bg-[#050811] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300 text-[10px]">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300 text-[10px]">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-[10px]">↵</kbd>
                  to select
                </span>
              </div>
              <div className="font-mono text-cyan-400 text-[10px] uppercase tracking-wider">
                GSFC RECOVERY HUB • v2.4
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
