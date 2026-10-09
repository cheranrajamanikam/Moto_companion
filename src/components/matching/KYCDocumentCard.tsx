import React, { useState } from 'react';
import type { KYCDocument, DocumentType } from "@/types/rider";
import { kycService } from "@/services/kycService";
import { FileText, Upload, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

interface KYCDocumentCardProps {
  userId?: string;
  type?: DocumentType;
  title?: string;
  description?: string;
  doc?: KYCDocument;
  document?: KYCDocument;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export const KYCDocumentCard: React.FC<KYCDocumentCardProps> = ({
  userId = 'user-001',
  type = 'AADHAAR',
  title = 'Document',
  description = 'Verification Document',
  doc,
  document,
  onUpdate,
  onDelete,
}) => {
  const activeDoc = document || doc;
  const [isUploading, setIsUploading] = useState(false);
  const [docNumber, setDocNumber] = useState('');
  const [showInput, setShowInput] = useState(false);

  const getPlaceholder = () => {
    if (type === 'AADHAAR') return 'XXXX-XXXX-9012 (Demo 12-digit Aadhaar)';
    if (type === 'PAN') return 'ABCDE1234F (Demo 10-char PAN)';
    return 'KA-01-20201234567 (Demo DL Number)';
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      kycService.uploadKYCDocument(
        userId,
        type,
        docNumber.trim().toUpperCase(),
        `${type.toLowerCase()}_demo_doc.pdf`
      );
      setIsUploading(false);
      setShowInput(false);
      setDocNumber('');
      if (onUpdate) onUpdate();
    }, 600);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      return;
    }
    if (activeDoc) {
      kycService.deleteKYCDocument(userId, activeDoc.id);
      if (onUpdate) onUpdate();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">{title || activeDoc?.type.replace('_', ' ')}</h4>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
        </div>

        {activeDoc ? (
          <div className="mt-4 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Document No:</span>
              <span className="font-mono text-slate-200 font-semibold">{activeDoc.documentNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">File Name:</span>
              <span className="text-slate-300 truncate max-w-[140px]">{activeDoc.fileName}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3.5 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">No document uploaded yet</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {showInput ? (
          <form onSubmit={handleSimulateUpload} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Enter Fictional Demo Document Number
              </label>
              <input
                type="text"
                placeholder={getPlaceholder()}
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                required
              />
              <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Use fictional demo numbers only.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                {isUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Simulate Upload & Verify
              </button>
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            {activeDoc ? (
              <>
                <button
                  onClick={() => setShowInput(true)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                  Replace
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition-colors"
                >
                  Remove
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
