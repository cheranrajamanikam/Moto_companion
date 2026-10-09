import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { kycService } from "@/services/kycService";
import { KYCDocumentCard } from "@/components/matching/KYCDocumentCard";
import { KYCStatusBadge } from "@/components/matching/KYCStatusBadge";
import type { UserProfile, DocumentType } from "@/types/rider";
import { ShieldCheck, Lock, AlertCircle, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/kyc")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "kyc" } });
  },
  head: () => ({
    meta: [{ title: "KYC Verification — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="KYC Verification">
      <KycTabContent />
    </AppShell>
  );
}

export function KycTabContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(userService.getCurrentUser());
  const [selectedType, setSelectedType] = useState<DocumentType>('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setUser(userService.getCurrentUser());
  }, []);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber || !fileName) return;

    setIsUploading(true);
    setTimeout(() => {
      kycService.uploadKYCDocument(user.userId, selectedType, docNumber, fileName);
      const updated = userService.getCurrentUser();
      setUser(updated);
      setIsUploading(false);
      setDocNumber('');
      setFileName('');
      setSuccessMsg(`${selectedType.replace('_', ' ')} uploaded & verified successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 600);
  };

  const handleDeleteDoc = (docId: string) => {
    kycService.deleteKYCDocument(user.userId, docId);
    setUser(userService.getCurrentUser());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-slate-100">KYC Verification</h1>
            </div>
            <p className="text-xs text-slate-400">
              Complete government identity verification to build trust with potential riding partners.
            </p>
          </div>
        </div>

        <KYCStatusBadge status={user.kycStatus} />
      </div>

      {/* Demo Warning Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-300">
        <Lock className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <span className="font-bold block text-emerald-200">Prototype Demo KYC System</span>
          This is a simulated verification interface for testing purposes. Please use fictional demo document numbers (e.g. AADHAAR `XXXX-1234`, PAN `ABCDE1234F`). No real government identity checks are conducted.
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Grid: Upload Form + Uploaded Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="md:col-span-1 glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-orange-400" />
            Upload Document
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="DRIVING_LICENCE">Driving Licence</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Number (Demo)</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder={
                  selectedType === 'AADHAAR'
                    ? 'XXXX-XXXX-1234'
                    : selectedType === 'PAN'
                    ? 'ABCDE1234F'
                    : 'DL-1420110012345'
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">File Name / File Upload</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="aadhaar_front_back.pdf"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full mt-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold transition-colors shadow-lg shadow-orange-500/20"
            >
              {isUploading ? 'Simulating Verification...' : 'Submit Document'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Your Verification Documents</h3>

          {user.kycDocuments.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No identity documents uploaded yet.</p>
              <p className="text-[11px] text-slate-500">
                Upload Aadhaar, PAN, and Driving Licence to reach 100% KYC Verified status.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.kycDocuments.map((doc) => (
                <KYCDocumentCard key={doc.id} document={doc} onDelete={() => handleDeleteDoc(doc.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
