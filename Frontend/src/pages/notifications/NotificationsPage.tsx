import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  AlertCircle,
  Sparkles,
  KeyRound,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationType } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { fireCelebration } from '../../lib/confetti';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filtered = filterUnreadOnly
    ? notifications.filter((n) => !n.readAt)
    : notifications;

  const handleMarkAll = async () => {
    await markAllAsRead();
    fireCelebration();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CLAIM_APPROVED:
        return <KeyRound className="w-4 h-4 text-emerald-400" />;
      case NotificationType.MORE_INFO_NEEDED:
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case NotificationType.POSSIBLE_MATCH:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case NotificationType.READY_FOR_COLLECTION:
        return <CheckCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              ALERTS & TELEMETRY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-neutral-400">
              REAL-TIME DISPATCH
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time verified incident alerts, claim decisions, and automated matching updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAll}
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 mr-1.5 text-neutral-400" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3 text-xs">
        <button
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-4 py-2 rounded-xl transition-all font-medium ${
            !filterUnreadOnly
              ? 'bg-white/10 text-white font-semibold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2 ${
            filterUnreadOnly
              ? 'bg-white/10 text-white font-semibold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-black text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-neutral-400 font-mono">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Synchronizing alerts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No notifications to display</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {filterUnreadOnly
              ? 'You have caught up with all of your unread notifications!'
              : 'Alerts regarding your items, claims, or matching events will arrive here in real time.'}
          </p>
        </div>
      ) : (
        <StaggerContainer className="bg-[#12151D] rounded-2xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
          {filtered.map((n) => {
            const isUnread = !n.readAt;
            return (
              <StaggerItem
                key={n.id}
                onClick={() => isUnread && markAsRead(n.id)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-white/[0.02] hover:bg-white/[0.04] border-l-2 border-l-white'
                    : 'hover:bg-white/[0.02] opacity-75'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/[0.06] flex-shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isUnread ? 'font-medium text-white' : 'text-neutral-400'
                      }`}
                    >
                      {n.message}
                    </p>
                    <span className="text-[11px] text-neutral-500 mt-1.5 block font-mono">
                      {new Date(n.createdAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </PageTransition>
  );
};
