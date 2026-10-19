import React, { useState } from 'react';
import { Bell, CheckCheck, Check, AlertCircle, Sparkles, KeyRound, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationType } from '../../types/enums';
import { EmptyState } from '../../components/common/EmptyState';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filtered = filterUnreadOnly
    ? notifications.filter((n) => !n.readAt)
    : notifications;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CLAIM_APPROVED:
        return <KeyRound className="w-5 h-5 text-emerald-600" />;
      case NotificationType.MORE_INFO_NEEDED:
        return <AlertCircle className="w-5 h-5 text-purple-600" />;
      case NotificationType.POSSIBLE_MATCH:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case NotificationType.READY_FOR_COLLECTION:
        return <CheckCheck className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-brand-600" />;
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates regarding your reported cases, claims, and candidate matches.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="text-brand-700 bg-brand-50/80 border-brand-200 hover:bg-brand-100 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            !filterUnreadOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterUnreadOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications to display"
          description={
            filterUnreadOnly
              ? 'You have caught up with all of your unread notifications!'
              : 'Notifications will appear here as soon as there are updates on your items or claims.'
          }
        />
      ) : (
        <StaggerContainer className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-subtle">
          {filtered.map((n) => {
            const isUnread = !n.readAt;
            return (
              <StaggerItem
                key={n.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  isUnread ? 'bg-brand-50/25 hover:bg-brand-50/45' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5 border border-slate-200/60">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {n.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      {new Date(n.createdAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
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
