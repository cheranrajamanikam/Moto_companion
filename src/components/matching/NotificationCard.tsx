import React from 'react';
import type { Notification } from "@/types/rider";
import { Sparkles, UserPlus, CheckCircle2, AlertTriangle, ShieldCheck, ShoppingBag, MessageSquare, Bell } from 'lucide-react';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClickAction?: (notif: Notification) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onClickAction,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'MATCH':
        return <Sparkles className="w-4 h-4 text-orange-400" />;
      case 'RIDE_REQUEST':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'REQUEST_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'KYC':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'SOS':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'SHOP':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onClick={() => {
        if (onMarkRead && !notification.read) onMarkRead(notification.notificationId);
        if (onClickAction) onClickAction(notification);
      }}
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        notification.read
          ? 'bg-slate-900/50 border-slate-800/80 text-slate-300'
          : 'bg-slate-900 border-orange-500/30 text-slate-100 shadow-md shadow-orange-500/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-100">{notification.title}</h4>
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(notification.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
        </div>

        {!notification.read && (
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5 animate-pulse"></span>
        )}
      </div>
    </div>
  );
};
