import React from 'react';
import type { KYCStatus } from "@/types/rider";
import { ShieldCheck, Clock, AlertCircle, FileX } from 'lucide-react';

interface KYCStatusBadgeProps {
  status: KYCStatus;
  showText?: boolean;
  className?: string;
}

export const KYCStatusBadge: React.FC<KYCStatusBadgeProps> = ({
  status,
  showText = true,
  className = '',
}) => {
  const statusConfig = {
    VERIFIED: {
      label: 'KYC Verified',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
    },
    PENDING: {
      label: 'Verification Pending',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    NOT_UPLOADED: {
      label: 'KYC Not Uploaded',
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: FileX,
    },
    REJECTED: {
      label: 'Document Rejected',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.NOT_UPLOADED;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${config.color} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      {showText && config.label}
    </span>
  );
};
