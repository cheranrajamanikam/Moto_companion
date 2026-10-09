import React from 'react';
import { Layers, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

interface IntegrationPlaceholderProps {
  moduleName?: string;
  targetMember?: string;
  featureTitle: string;
  description: string;
  entityId?: string;
  entityType?: 'rideId' | 'userId' | 'bikeId';
  payloadSummary?: Record<string, any>;
  onBack?: () => void;
}

export const IntegrationPlaceholder: React.FC<IntegrationPlaceholderProps> = ({
  moduleName = 'Member Module',
  targetMember,
  featureTitle,
  description,
  entityId,
  entityType,
  payloadSummary,
  onBack,
}) => {
  const navigate = useNavigate();
  const displayModule = targetMember || moduleName;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => (onBack ? onBack() : window.history.back())}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Integration Ready Point ({displayModule})
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100">{featureTitle}</h1>
            <p className="text-sm text-slate-400 max-w-2xl">{description}</p>
          </div>
        </div>

        {/* Integration Parameters Payload Display */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Received Integration Parameters
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Contract Verified
            </span>
          </div>

          {entityId && (
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono">
              <span className="text-slate-400">{entityType || 'Entity ID'}:</span>
              <span className="text-amber-400 font-bold">{entityId}</span>
            </div>
          )}

          {payloadSummary && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto">
              <pre className="text-[11px] leading-relaxed text-slate-300">
                {JSON.stringify(payloadSummary, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Developer Hand-off Note:</p>
          <p>
            Member 2 has passed all canonical data models and user context to this route. {moduleName} can mount their full production UI directly into this component.
          </p>
        </div>
      </div>
    </div>
  );
};
